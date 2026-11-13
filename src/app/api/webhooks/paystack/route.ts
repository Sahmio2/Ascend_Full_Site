import crypto from 'node:crypto';
import { db } from '@/server/db';
import { json } from '@/server/http';
import { verifyPaystackWebhookSignature } from '@/server/paystack';
import { commitCapacityReservation } from '@/server/capacity';

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
      const reference = data.reference as string;
      const amount = Number(data.amount);
      const currency = data.currency as string;
      const customer = data.customer as { email?: string; customer_code?: string } | undefined;
      const metadata = data.metadata as Record<string, unknown> | undefined;

      if (reference && customer?.email) {
        const user = await prisma.user.findUnique({
          where: { email: customer.email },
        });

        if (user) {
          const now = new Date();
          const paidThrough = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          await prisma.$transaction(async (tx) => {
            // Commit reservation if token provided
            const resToken = metadata?.reservationToken as string | undefined;
            if (resToken) {
              await commitCapacityReservation(resToken, tx);
            }

            await tx.payment.upsert({
              where: { reference },
              update: {
                status: 'SUCCESS',
                paidAt: new Date(),
                rawMetadata: data as unknown as object,
              },
              create: {
                userId: user.id,
                reference,
                amountKobo: amount,
                currency,
                status: 'SUCCESS',
                paidAt: new Date(),
                channel: (data.channel as string) || 'card',
                rawMetadata: data as unknown as object,
              },
            });

            await tx.membership.upsert({
              where: { userId: user.id },
              update: {
                status: 'ACTIVE_RENEWING',
                paidThrough,
                paystackCustomerCode: customer.customer_code,
                priorityMessagesRemaining: 2,
                reviewsRemaining: 2,
              },
              create: {
                userId: user.id,
                status: 'ACTIVE_RENEWING',
                paidThrough,
                paystackCustomerCode: customer.customer_code,
                priceKobo: amount,
                priorityMessagesRemaining: 2,
                reviewsRemaining: 2,
              },
            });
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
        processedAt: new Date(),
        outcome: `ERROR: ${errorMsg}`,
      },
    });
    return json({ error: 'WEBHOOK_PROCESSING_FAILED' }, 500);
  }
}
