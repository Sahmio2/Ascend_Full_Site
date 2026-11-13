import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, ApiError } from '@/server/http';
import { verifyPaystackTransaction, ASCEND_MONTHLY_PRICE_KOBO } from '@/server/paystack';
import { commitCapacityReservation } from '@/server/capacity';

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');

  if (!reference || typeof reference !== 'string') {
    throw new ApiError(400, 'REFERENCE_REQUIRED');
  }

  const prisma = db();

  // Check if this payment was already processed and verified locally
  const existingPayment = await prisma.payment.findUnique({
    where: { reference },
  });

  if (existingPayment && existingPayment.status === 'SUCCESS') {
    const membership = await prisma.membership.findUnique({ where: { userId } });
    return json({
      status: 'ACTIVE',
      alreadyVerified: true,
      paidThrough: membership?.paidThrough,
      reference,
    });
  }

  // Authoritatively verify with Paystack
  const verification = await verifyPaystackTransaction(reference);

  if (!verification.status || verification.data.status !== 'success') {
    throw new ApiError(402, 'PAYMENT_NOT_SUCCESSFUL');
  }

  if (verification.data.amount < ASCEND_MONTHLY_PRICE_KOBO || verification.data.currency !== 'NGN') {
    throw new ApiError(400, 'INVALID_PAYMENT_AMOUNT_OR_CURRENCY');
  }

  // Run atomic fulfillment
  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const paidThrough = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day billing cycle

    const reservationToken = verification.data.metadata?.reservationToken as string | undefined;
    if (reservationToken) {
      await commitCapacityReservation(reservationToken, tx);
    } else {
      // Commit user's pending reservation if token not in metadata
      const pendingRes = await tx.capacityReservation.findFirst({
        where: { userId, status: 'PENDING' },
      });
      if (pendingRes) {
        await commitCapacityReservation(pendingRes.token, tx);
      }
    }

    // Record verified payment
    await tx.payment.upsert({
      where: { reference },
      update: {
        status: 'SUCCESS',
        paidAt: new Date(verification.data.paid_at || now),
        channel: verification.data.channel,
        rawMetadata: verification.data as unknown as object,
      },
      create: {
        userId,
        reference,
        amountKobo: verification.data.amount,
        currency: verification.data.currency,
        status: 'SUCCESS',
        paidAt: new Date(verification.data.paid_at || now),
        channel: verification.data.channel,
        rawMetadata: verification.data as unknown as object,
      },
    });

    // Activate membership
    const membership = await tx.membership.upsert({
      where: { userId },
      update: {
        status: 'ACTIVE_RENEWING',
        paidThrough,
        paystackCustomerCode: verification.data.customer?.customer_code,
        paystackSubscriptionCode: verification.data.subscription?.subscription_code,
        paystackEmailToken: verification.data.subscription?.email_token,
        cancelAtPeriodEnd: false,
        priorityMessagesRemaining: 2,
        reviewsRemaining: 2,
      },
      create: {
        userId,
        status: 'ACTIVE_RENEWING',
        paidThrough,
        paystackCustomerCode: verification.data.customer?.customer_code,
        paystackSubscriptionCode: verification.data.subscription?.subscription_code,
        paystackEmailToken: verification.data.subscription?.email_token,
        priceKobo: ASCEND_MONTHLY_PRICE_KOBO,
        priorityMessagesRemaining: 2,
        reviewsRemaining: 2,
      },
    });

    // Ensure client assessment record exists for nine-stage intake
    await tx.clientAssessment.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        status: 'NOT_STARTED',
      },
    });

    // Remove from waitlist if user was previously waiting
    await tx.waitlistEntry.deleteMany({
      where: { userId },
    });

    return membership;
  });

  return json({
    status: 'ACTIVE',
    paidThrough: result.paidThrough,
    reference,
    message: 'Payment verified and membership activated',
  });
});
