import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json } from '@/server/http';
import { getCapacityStatus } from '@/server/capacity';

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const prisma = db();

  const [membership, user, capacity] = await Promise.all([
    prisma.membership.findUnique({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, createdAt: true, role: true },
    }),
    getCapacityStatus(),
  ]);

  const now = new Date();
  const isActive =
    membership &&
    ['ACTIVE_RENEWING', 'NON_RENEWING'].includes(membership.status) &&
    membership.paidThrough &&
    membership.paidThrough > now;

  return json({
    user,
    membership: membership
      ? {
          status: membership.status,
          paidThrough: membership.paidThrough,
          cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
          reviewsRemaining: membership.reviewsRemaining,
          priorityMessagesRemaining: membership.priorityMessagesRemaining,
          priceKobo: membership.priceKobo,
          isActive,
        }
      : null,
    capacity: {
      remainingSeats: capacity.remainingSeats,
      remainingWeeklyOnboardings: capacity.remainingWeeklyOnboardings,
      isAvailable: capacity.isAvailable,
      isFoundingCapFull: capacity.isFoundingCapFull,
      isWeeklyFull: capacity.isWeeklyFull,
    },
  });
});
