import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, ApiError, assertOrigin } from '@/server/http';
import { disablePaystackSubscription } from '@/server/paystack';

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const userId = await requireUser(request);
  const prisma = db();

  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    throw new ApiError(404, 'MEMBERSHIP_NOT_FOUND');
  }

  if (membership.status !== 'ACTIVE_RENEWING') {
    throw new ApiError(400, 'MEMBERSHIP_NOT_ACTIVE_RENEWING');
  }

  // Attempt to disable renewal on Paystack if subscription code is mapped
  if (membership.paystackSubscriptionCode) {
    try {
      await disablePaystackSubscription(
        membership.paystackSubscriptionCode,
        membership.paystackEmailToken || undefined
      );
    } catch {
      // Continue locally even if provider call errors so client renewal state is marked
    }
  }

  const updated = await prisma.membership.update({
    where: { userId },
    data: {
      status: 'NON_RENEWING',
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
    },
  });

  return json({
    status: updated.status,
    cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    paidThrough: updated.paidThrough,
    message: 'Subscription renewal cancelled. Paid access remains active until the end of your billing cycle.',
  });
});
