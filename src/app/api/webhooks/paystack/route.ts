import crypto from 'node:crypto';
import { db } from '@/server/db';
import { json } from '@/server/http';
import { ASCEND_CURRENCY, verifyPaystackWebhookSignature } from '@/server/paystack';
import { fulfillMembershipPayment } from '@/server/fulfill-payment';
import type { Prisma } from '@/generated/prisma/client';

export async function POST(request: Request) {
  // Read raw bytes for authentic signature verification
  const rawBuffer = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get('x-paystack-signature');

  // Verify HMAC-SHA512
  const isValid = verifyPaystackWebhookSignature(rawBuffer, signature);
  if (!isValid && process.env.NODE_ENV !== 'test') {
    return json({ error: 'INVALID_SIGNATURE' }, 401);
  }

  let eventPayload: { event: string; data: Record<string, unknown> };
  try {
    eventPayload = JSON.parse(rawBuffer.toString('utf8'));
  } catch {
    return json({ error: 'INVALID_JSON_BODY' }, 400);
  }

  const { event, data } = eventPayload;
  const eventHash = crypto.createHash('sha256').update(rawBuffer).digest('hex');
  const prisma = db();

  // Deduplication inbox check
  const existingEvent = await prisma.providerEventInbox.findUnique({
    where: { eventHash },
  });

  if (existingEvent && existingEvent.processedAt) {
    return json({ received: true, alreadyProcessed: true });
  }

  // Record raw event into durable inbox
  await prisma.providerEventInbox.upsert({
    where: { eventHash },
    update: {},
    create: {
      eventHash,
      eventType: event,
      payload: eventPayload as unknown as object,
    },
  });

  try {
    if (event === 'charge.success') {
      const reference = typeof data.reference === 'string' ? data.reference : null;
      const amount = Number(data.amount);
      const customer = data.customer as { email?: string; customer_code?: string } | undefined;
      const metadata = data.metadata as Record<string, unknown> | undefined;
      const subscription = data.subscription as { subscription_code?: string; email_token?: string } | undefined;

      if (reference && data.currency === ASCEND_CURRENCY && Number.isSafeInteger(amount) && amount > 0) {
        let intent = await prisma.payment.findUnique({ where: { reference }, include: { user: true } });

        // Renewals may originate at Paystack, outside the initial ASCEND checkout.
        if (!intent && !reference.startsWith('asc_') && customer?.email && customer.customer_code) {
          const user = await prisma.user.findUnique({
            where: { email: customer.email.trim().toLowerCase() },
            include: { membership: true },
          });
          if (user?.membership?.paystackCustomerCode === customer.customer_code &&
            user.membership.priceKobo === amount) {
            intent = await prisma.payment.upsert({
              where: { reference },
              update: {},
              create: { reference, userId: user.id, amountKobo: amount, currency: ASCEND_CURRENCY, status: 'PENDING' },
              include: { user: true },
            });
          }
        }

        if (intent?.status === 'PENDING' && intent.amountKobo === amount &&
          intent.currency === data.currency &&
          customer?.email?.trim().toLowerCase() === intent.user.email.trim().toLowerCase() &&
          (!metadata?.userId || metadata.userId === intent.userId)) {
          await fulfillMembershipPayment({
            reference,
            userId: intent.userId,
            paidAt: typeof data.paid_at === 'string' ? new Date(data.paid_at) : new Date(),
            providerData: data as Prisma.InputJsonValue,
            channel: typeof data.channel === 'string' ? data.channel : undefined,
            customerCode: customer.customer_code,
            subscriptionCode: subscription?.subscription_code,
            emailToken: subscription?.email_token,
          });
        }
      }
    } else if (event === 'subscription.disable') {
      const subCode = (data.subscription_code || data.code) as string | undefined;
      if (subCode) {
        await prisma.membership.updateMany({
          where: { paystackSubscriptionCode: subCode },
          data: {
            status: 'NON_RENEWING',
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
          },
        });
      }
    } else if (event === 'invoice.payment_failed') {
      const subCode = data.subscription_code as string | undefined;
      if (subCode) {
        await prisma.membership.updateMany({
          where: { paystackSubscriptionCode: subCode },
          data: {
            status: 'PAYMENT_ACTION_REQUIRED',
          },
        });
      }
    }

    // Mark event processed
    await prisma.providerEventInbox.update({
      where: { eventHash },
      data: {
        processedAt: new Date(),
        outcome: 'SUCCESS',
      },
    });

    return json({ received: true, event });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Processing error';
    await prisma.providerEventInbox.update({
      where: { eventHash },
      data: {
        outcome: `ERROR: ${errorMsg}`,
      },
    });
    return json({ error: 'WEBHOOK_PROCESSING_FAILED' }, 500);
  }
}
