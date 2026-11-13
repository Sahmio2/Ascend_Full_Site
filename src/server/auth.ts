import { cookies } from 'next/headers';
import crypto, { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
import { ApiError } from './http';
import { getCapacityStatus } from './capacity';
import type { User, Role } from '../generated/prisma/client';

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export function sessionIsActive(
  session: { expiresAt: Date; revokedAt: Date | null } | null,
  now = new Date()
) {
  return !!session && !session.revokedAt && session.expiresAt > now;
}

export async function requireUser(request?: Request): Promise<string> {
  let token: string | undefined;
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/ascend_session=([a-f0-9]{64})/);
    if (match) token = match[1];
  }
  if (!token) {
    try {
      const jar = await cookies();
      token = jar.get('ascend_session')?.value;
    } catch {
      // outside Next.js request context
    }
  }
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, 'UNAUTHENTICATED');
  const session = await db().session.findUnique({ where: { tokenHash: tokenHash(token) } });
  if (!sessionIsActive(session)) throw new ApiError(401, 'UNAUTHENTICATED');
  return session!.userId;
}

export async function requireCoach(request?: Request): Promise<{ userId: string; user: User }> {
  const userId = await requireUser(request);
  const user = await db().user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'COACH') {
    throw new ApiError(403, 'FORBIDDEN_COACH_ROLE_REQUIRED');
  }
  return { userId, user };
}

export interface IssuedSession {
  token: string;
  cookieHeader: string;
  expiresAt: Date;
}

export async function issueUserSession(userId: string, hours = 168): Promise<IssuedSession> {
  const prisma = db();
  const now = new Date();

  // Revoke active sessions for single active device / session rotation
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { revokedAt: now },
  });

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      expiresAt,
    },
  });

  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = hours * 3600;
  const cookieHeader = `ascend_session=${token}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${maxAge}`;

  try {
    const jar = await cookies();
    jar.set('ascend_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  } catch {}

  return { token, cookieHeader, expiresAt };
}

export type AccountStatusKey =
  | 'assessment'
  | 'review'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'safety'
  | 'guardian'
  | 'waitlist'
  | 'payment'
  | 'under_16';

export interface AccountSnapshot {
  userId: string;
  email: string;
  firstName: string;
  role: Role;
  status: AccountStatusKey;
  statusTitle: string;
  statusDescription: string;
  statusActionLabel: string;
  statusActionPath: string;
  badge: string;
  badgeVariant: 'green' | 'red' | '';
  clientPortalAccess: boolean;
  membership: {
    status: string | null;
    paidThrough: string | null;
    cancelAtPeriodEnd: boolean;
    priceKobo: number;
    priceFormatted: string;
  };
  capacity: {
    isAvailable: boolean;
    remainingSeats: number;
  };
}

const STATUS_DEFINITIONS: Record<
  AccountStatusKey,
  {
    title: string;
    desc: string;
    action: string;
    path: string;
    badge: string;
    variant: 'green' | 'red' | '';
  }
> = {
  assessment: {
    title: 'Assessment to complete',
    desc: 'Your membership is confirmed. Finish the private nine-stage assessment to help Sahmi prepare your programme.',
    action: 'Continue assessment',
    path: '/assessment',
    badge: 'Awaiting assessment',
    variant: 'green',
  },
  review: {
    title: 'Programme under review',
    desc: 'Your completed assessment has been received. Sahmi will review your training and nutrition programme within five business days of a complete submission.',
    action: 'View review status',
    path: '/account',
    badge: 'In review',
    variant: '',
  },
  active: {
    title: 'Your coaching is active',
    desc: 'Your approved plan is ready. Open Today to see the next useful action in your programme.',
    action: 'Open client portal',
    path: '/client/dashboard',
    badge: 'Active coaching',
    variant: 'green',
  },
  cancelled: {
    title: 'Renewal cancelled',
    desc: 'Your subscription will not renew. Continue using the paid coaching period until the recorded end date.',
    action: 'View membership',
    path: '/account/membership',
    badge: 'Paid through · not renewing',
    variant: '',
  },
  expired: {
    title: 'Your paid period has ended',
    desc: 'You can still access permitted account and billing details. Rejoining coaching depends on current eligibility and available capacity.',
    action: 'View membership options',
    path: '/account/membership',
    badge: 'Expired',
    variant: '',
  },
  safety: {
    title: 'Safety review required',
    desc: 'A coaching safety restriction is being reviewed. No new programme can be activated while this restriction remains.',
    action: 'View required action',
    path: '/account',
    badge: 'Safety hold',
    variant: 'red',
  },
  guardian: {
    title: 'Guardian verification pending',
    desc: 'A verified parent or legal guardian must complete the required consent and payment steps before a minor can begin paid coaching.',
    action: 'View next steps',
    path: '/account',
    badge: 'Guardian consent pending',
    variant: '',
  },
  waitlist: {
    title: 'Currently at capacity',
    desc: 'Your account is saved, but all coaching places are currently occupied or this week’s onboarding cap has been reached.',
    action: 'Join optional waitlist',
    path: '/waitlist',
    badge: 'Capacity full',
    variant: '',
  },
  payment: {
    title: 'Your membership is not yet active',
    desc: 'Your account is ready. Once eligibility and capacity requirements are met, you can review the membership offer and pay securely.',
    action: 'View membership',
    path: '/account/membership',
    badge: 'Not paid',
    variant: '',
  },
  under_16: {
    title: 'Coaching not available',
    desc: 'ASCEND coaching is designed for athletes aged 16 and above. Contact collection and registration cannot proceed.',
    action: 'Return home',
    path: '/',
    badge: 'Under age requirement',
    variant: 'red',
  },
};

export async function getAccountSnapshot(userId: string): Promise<AccountSnapshot> {
  const prisma = db();
  const now = new Date();

  const [user, screening, membership, assessment, capacity] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.registrantScreening.findUnique({ where: { userId } }),
    prisma.membership.findUnique({ where: { userId } }),
    prisma.clientAssessment.findUnique({ where: { userId } }),
    getCapacityStatus(),
  ]);

  if (!user) throw new ApiError(404, 'USER_NOT_FOUND');

  // Determine status key
  let key: AccountStatusKey = 'payment';

  const isMinorUnder16 =
    screening?.ageRange === 'under_16' || screening?.eligibility === 'UNDER_16';
  const isGuardianPending =
    screening?.ageRange === '16_17' || screening?.eligibility === 'GUARDIAN_PENDING';
  const isSafetyHeld =
    screening?.eligibility === 'SAFETY_HOLD' || assessment?.status === 'SAFETY_HELD';

  const isPaidPeriod = Boolean(
    membership &&
      ['ACTIVE_RENEWING', 'NON_RENEWING'].includes(membership.status) &&
      membership.paidThrough &&
      membership.paidThrough > now
  );

  const isCancelledPaid = Boolean(
    isPaidPeriod && membership?.status === 'NON_RENEWING' && membership?.cancelAtPeriodEnd
  );

  const isExpired = Boolean(
    membership &&
      membership.paidThrough &&
      membership.paidThrough <= now &&
      membership.status === 'ENDED'
  );

  if (isMinorUnder16) {
    key = 'under_16';
  } else if (isSafetyHeld) {
    key = 'safety';
  } else if (isGuardianPending) {
    key = 'guardian';
  } else if (isExpired) {
    key = 'expired';
  } else if (isPaidPeriod) {
    if (!assessment || assessment.status === 'NOT_STARTED' || assessment.status === 'IN_PROGRESS') {
      key = 'assessment';
    } else if (assessment.status === 'SUBMITTED') {
      key = 'review';
    } else if (assessment.status === 'APPROVED') {
      key = isCancelledPaid ? 'cancelled' : 'active';
    } else {
      key = isCancelledPaid ? 'cancelled' : 'active';
    }
  } else {
    // Unpaid state
    if (!capacity.isAvailable || screening?.eligibility === 'CAPACITY_WAIT') {
      key = 'waitlist';
    } else {
      key = 'payment';
    }
  }

  const def = STATUS_DEFINITIONS[key];
  const clientPortalAccess = (key === 'active' || key === 'cancelled') && !isSafetyHeld;

  return {
    userId: user.id,
    email: user.email,
    firstName: screening?.firstName || user.email.split('@')[0],
    role: user.role,
    status: key,
    statusTitle: def.title,
    statusDescription: def.desc,
    statusActionLabel: def.action,
    statusActionPath: def.path,
    badge: def.badge,
    badgeVariant: def.variant,
    clientPortalAccess,
    membership: {
      status: membership?.status ?? null,
      paidThrough: membership?.paidThrough ? membership.paidThrough.toISOString() : null,
      cancelAtPeriodEnd: membership?.cancelAtPeriodEnd ?? false,
      priceKobo: membership?.priceKobo ?? 4000000,
      priceFormatted: '₦40,000',
    },
    capacity: {
      isAvailable: capacity.isAvailable,
      remainingSeats: capacity.remainingSeats,
    },
  };
}
