import { randomBytes } from 'node:crypto';
import { db } from '@/server/db';
import { hasPaidMembership, requireUser } from '@/server/auth';
import { handler, json, ApiError, assertOrigin } from '@/server/http';
import { reserveCapacitySlot } from '@/server/capacity';
import { initializePaystackCheckout, ASCEND_MONTHLY_PRICE_KOBO } from '@/server/paystack';

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const userId = await requireUser(request);
  const prisma = db();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { screening: true, membership: true },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND');
  }

  if (hasPaidMembership(user.membership)) throw new ApiError(409, 'MEMBERSHIP_ALREADY_PAID');

  const assessment = await prisma.clientAssessment.findUnique({
    where: { userId },
    select: { status: true },
  });
  if (assessment?.status === 'SAFETY_HELD') throw new ApiError(403, 'SAFETY_HOLD_ACTIVE');

  // Check eligibility gates
  if (user.screening) {
    if (user.screening.eligibility === 'UNDER_16' || user.screening.ageRange === 'under_16') {
      throw new ApiError(403, 'AGE_RESTRICTED_UNDER_16');
    }
    if (user.screening.eligibility === 'SAFETY_HOLD') {
      throw new ApiError(403, 'SAFETY_HOLD_ACTIVE');
    }
    if (user.screening.eligibility === 'GUARDIAN_PENDING' || user.screening.ageRange === '16_17') {
      throw new ApiError(403, 'GUARDIAN_CONSENT_REQUIRED');
    }
    if (user.screening.eligibility === 'NOT_READY') {
      throw new ApiError(403, 'REGISTRATION_FOLLOW_UP_REQUIRED');
    }
    if (user.screening.eligibility === 'EQUIPMENT_HOLD') {
      throw new ApiError(403, 'EQUIPMENT_HOLD_ACTIVE');
    }
  }

  // Reserve capacity slot atomically
  let reservation;
  try {
    reservation = await reserveCapacitySlot(userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('CAPACITY_FULL_FOUNDING_10')) {
      throw new ApiError(409, 'CAPACITY_FULL_FOUNDING_10');
    }
    if (message.includes('CAPACITY_FULL_WEEKLY_3')) {
      throw new ApiError(409, 'CAPACITY_FULL_WEEKLY_3');
    }
    throw err;
  }

  if (reservation.token === 'already_active') throw new ApiError(409, 'MEMBERSHIP_ALREADY_PAID');

  const reference = `asc_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const origin = request.headers.get('origin') || process.env.APP_ORIGIN || 'http://localhost:3000';
  const callbackUrl = `${origin}/client/billing/callback`;

  const checkout = await initializePaystackCheckout({
    email: user.email,
    reference,
    amountKobo: ASCEND_MONTHLY_PRICE_KOBO,
    callbackUrl,
    metadata: {
      userId: user.id,
      reservationToken: reservation.token,
    },
  });

  // Track the pending payment intent
  await prisma.payment.create({
    data: {
      userId,
      reference,
      amountKobo: ASCEND_MONTHLY_PRICE_KOBO,
      status: 'PENDING',
      rawMetadata: {
        reservationToken: reservation.token,
        initiatedAt: new Date().toISOString(),
      },
    },
  });

  return json({
    authorizationUrl: checkout.data.authorization_url,
    reference,
    reservationToken: reservation.token,
    expiresAt: reservation.expiresAt,
  });
});
