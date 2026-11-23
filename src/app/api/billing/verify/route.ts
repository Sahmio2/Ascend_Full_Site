import { db } from '@/server/db';
import { hasPaidMembership, requireUser } from '@/server/auth';
import { handler, json, ApiError } from '@/server/http';
import { verifyPaystackTransaction } from '@/server/paystack';
import { fulfillMembershipPayment } from '@/server/fulfill-payment';
import type { Prisma } from '@/generated/prisma/client';

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const reference = new URL(request.url).searchParams.get('reference');
  if (!reference || !/^[\w.=-]{1,100}$/.test(reference)) {
    throw new ApiError(400, 'REFERENCE_REQUIRED');
  }

  const prisma = db();
  const intent = await prisma.payment.findUnique({ where: { reference, userId } });
  if (!intent) throw new ApiError(404, 'PAYMENT_NOT_FOUND');

  if (intent.status === 'SUCCESS') {
    const membership = await prisma.membership.findUnique({ where: { userId } });
    if (!hasPaidMembership(membership)) throw new ApiError(409, 'MEMBERSHIP_NOT_ACTIVE');
    return json({ status: 'ACTIVE', alreadyVerified: true, paidThrough: membership?.paidThrough, reference });
  }
  if (intent.status !== 'PENDING') throw new ApiError(402, 'PAYMENT_NOT_SUCCESSFUL');

  const verification = await verifyPaystackTransaction(reference);
  const payment = verification.data;
  if (verification.status && ['ongoing', 'pending', 'processing', 'queued'].includes(payment.status)) {
    return json({ status: 'PENDING' }, 202);
  }
  if (!verification.status || payment.status !== 'success') {
    throw new ApiError(402, 'PAYMENT_NOT_SUCCESSFUL');
  }
  if (payment.reference !== reference || payment.amount !== intent.amountKobo ||
    payment.currency !== intent.currency ||
    (payment.metadata?.userId && payment.metadata.userId !== userId)) {
    throw new ApiError(400, 'PAYMENT_DETAILS_MISMATCH');
  }

  const membership = await fulfillMembershipPayment({
    reference,
    userId,
    paidAt: new Date(payment.paid_at || Date.now()),
    providerData: payment as unknown as Prisma.InputJsonValue,
    channel: payment.channel,
    customerCode: payment.customer?.customer_code,
    subscriptionCode: payment.subscription?.subscription_code,
    emailToken: payment.subscription?.email_token,
  });
  if (!hasPaidMembership(membership)) throw new ApiError(409, 'MEMBERSHIP_NOT_ACTIVE');
  return json({ status: 'ACTIVE', paidThrough: membership?.paidThrough, reference });
});
