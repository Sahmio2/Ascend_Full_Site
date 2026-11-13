import crypto from 'node:crypto';
import { db } from './db';
import type { Prisma } from '../generated/prisma/client';

export const RESERVATION_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const DEFAULT_MAX_ACTIVE_CLIENTS = 10;
export const DEFAULT_MAX_WEEKLY_ONBOARDINGS = 3;

/**
 * Computes the ISO week key in Africa/Lagos timezone (e.g. "2026-W46").
 */
export function getLagosWeekKey(date = new Date()): string {
  // Format into Africa/Lagos
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.format(date).split('-'); // [YYYY, MM, DD]
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  
  // ISO week calculation
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns current real-time capacity and waitlist figures.
 */
export async function getCapacityStatus(client = db()) {
  const now = new Date();
  const currentWeek = getLagosWeekKey(now);

  const policy = (await client.capacityPolicy.findUnique({
    where: { id: 'default' },
  })) ?? {
    id: 'default',
    maxActiveClients: DEFAULT_MAX_ACTIVE_CLIENTS,
    maxWeeklyOnboardings: DEFAULT_MAX_WEEKLY_ONBOARDINGS,
  };

  // 1. Count active paid memberships
  const activeMembershipsCount = await client.membership.count({
    where: {
      status: { in: ['ACTIVE_RENEWING', 'NON_RENEWING'] },
      paidThrough: { gte: now },
    },
  });

  // 2. Count active pending reservations (held seats)
  const validReservationsCount = await client.capacityReservation.count({
    where: {
      status: 'PENDING',
      expiresAt: { gt: now },
    },
  });

  // 3. Count weekly onboardings consumed this week
  const weeklyOnboardingsCount = await client.capacityReservation.count({
    where: {
      weekKey: currentWeek,
      status: { in: ['PENDING', 'COMMITTED'] },
      expiresAt: { gt: now },
    },
  });

  const totalSeatsClaimed = activeMembershipsCount + validReservationsCount;
  const isFoundingCapFull = totalSeatsClaimed >= policy.maxActiveClients;
  const isWeeklyFull = weeklyOnboardingsCount >= policy.maxWeeklyOnboardings;

  return {
    policy,
    activeMembershipsCount,
    validReservationsCount,
    totalSeatsClaimed,
    remainingSeats: Math.max(0, policy.maxActiveClients - totalSeatsClaimed),
    weeklyOnboardingsCount,
    remainingWeeklyOnboardings: Math.max(0, policy.maxWeeklyOnboardings - weeklyOnboardingsCount),
    isFoundingCapFull,
    isWeeklyFull,
    isAvailable: !isFoundingCapFull && !isWeeklyFull,
    weekKey: currentWeek,
  };
}

/**
 * Atomically reserves 1 active seat and 1 weekly onboarding slot for 30 minutes.
 * Throws an explicit error if capacity is full.
 */
export async function reserveCapacitySlot(userId: string) {
  const prisma = db();

  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    const weekKey = getLagosWeekKey(now);

    // Ensure default policy row exists
    let policy = await tx.capacityPolicy.findUnique({ where: { id: 'default' } });
    if (!policy) {
      policy = await tx.capacityPolicy.create({
        data: {
          id: 'default',
          maxActiveClients: DEFAULT_MAX_ACTIVE_CLIENTS,
          maxWeeklyOnboardings: DEFAULT_MAX_WEEKLY_ONBOARDINGS,
        },
      });
    }

    // Garbage-collect any expired pending reservations for accuracy
    await tx.capacityReservation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    // Check if user already holds a valid pending reservation
    const existingReservation = await tx.capacityReservation.findFirst({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    if (existingReservation) {
      return {
        token: existingReservation.token,
        expiresAt: existingReservation.expiresAt,
        isExisting: true,
      };
    }

    // Check if user already has an active membership
    const existingMembership = await tx.membership.findUnique({
      where: { userId },
    });
    if (
      existingMembership &&
      ['ACTIVE_RENEWING', 'NON_RENEWING'].includes(existingMembership.status) &&
      existingMembership.paidThrough &&
      existingMembership.paidThrough > now
    ) {
      return {
        token: 'already_active',
        expiresAt: existingMembership.paidThrough,
        isExisting: true,
      };
    }

    // Check capacity invariants
    const activeMembersCount = await tx.membership.count({
      where: {
        status: { in: ['ACTIVE_RENEWING', 'NON_RENEWING'] },
        paidThrough: { gte: now },
      },
    });

    const activeReservationsCount = await tx.capacityReservation.count({
      where: {
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    if (activeMembersCount + activeReservationsCount >= policy.maxActiveClients) {
      throw new Error('CAPACITY_FULL_FOUNDING_10');
    }

    const weeklyOnboardingsCount = await tx.capacityReservation.count({
      where: {
        weekKey,
        status: { in: ['PENDING', 'COMMITTED'] },
        expiresAt: { gt: now },
      },
    });

    if (weeklyOnboardingsCount >= policy.maxWeeklyOnboardings) {
      throw new Error('CAPACITY_FULL_WEEKLY_3');
    }

    // Create reservation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MS);

    const reservation = await tx.capacityReservation.create({
      data: {
        token,
        userId,
        status: 'PENDING',
        weekKey,
        expiresAt,
      },
    });

    return {
      token: reservation.token,
      expiresAt: reservation.expiresAt,
      isExisting: false,
    };
  });
}

/**
 * Commits a reservation upon verified payment.
 */
export async function commitCapacityReservation(token: string, tx: Prisma.TransactionClient = db()) {
  const reservation = await tx.capacityReservation.findUnique({
    where: { token },
  });

  if (!reservation) {
    return null;
  }

  return await tx.capacityReservation.update({
    where: { token },
    data: { status: 'COMMITTED' },
  });
}

/**
 * Releases/cancels a reservation.
 */
export async function releaseCapacityReservation(token: string, tx: Prisma.TransactionClient = db()) {
  return await tx.capacityReservation.updateMany({
    where: { token, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
}
