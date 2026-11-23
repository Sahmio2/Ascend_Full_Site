import { db } from './db';
import { commitCapacityReservation } from './capacity';
import type { Prisma } from '../generated/prisma/client';

type VerifiedPayment = {
  reference: string;
  userId: string;
  paidAt: Date;
  providerData: Prisma.InputJsonValue;
  channel?: string;
  customerCode?: string;
  subscriptionCode?: string;
  emailToken?: string;
};

export async function fulfillMembershipPayment(payment: VerifiedPayment) {
  const prisma = db();
  const { reference, userId, paidAt, providerData, channel, customerCode, subscriptionCode, emailToken } = payment;

  const result = await prisma.$transaction(async (tx) => {
    const intent = await tx.payment.findUniqueOrThrow({ where: { reference, userId } });
    // The callback and webhook compete for the same pending row. Only one can activate membership.
    const claimed = await tx.payment.updateMany({
      where: { reference, userId, status: 'PENDING' },
      data: { status: 'SUCCESS', paidAt, rawMetadata: providerData, channel },
    });
    if (!claimed.count) return undefined;
    const existing = await tx.membership.findUnique({ where: { userId } });

    const metadata = intent.rawMetadata;
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) &&
      typeof metadata.reservationToken === 'string') {
      const reservation = await tx.capacityReservation.findUnique({
        where: { token: metadata.reservationToken, userId },
      });
      if (reservation) await commitCapacityReservation(reservation.token, tx);
    }

    const periodEnd = new Date(paidAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const paidThrough = existing?.paidThrough && existing.paidThrough > periodEnd
      ? existing.paidThrough
      : periodEnd;
    const activation = {
      status: 'ACTIVE_RENEWING' as const,
      paidThrough,
      paystackCustomerCode: customerCode,
      paystackSubscriptionCode: subscriptionCode,
      paystackEmailToken: emailToken,
      cancelAtPeriodEnd: false,
      priorityMessagesRemaining: 2,
      reviewsRemaining: 2,
    };
    const membership = await tx.membership.upsert({
      where: { userId },
      update: activation,
      create: { ...activation, userId, priceKobo: intent.amountKobo },
    });

    await tx.clientAssessment.upsert({
      where: { userId },
      update: {},
      create: { userId, status: 'NOT_STARTED' },
    });
    await tx.waitlistEntry.deleteMany({ where: { userId } });

    return membership;
  });
  return result ?? prisma.membership.findUnique({ where: { userId } });
}
