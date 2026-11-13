import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/server/db';
import { requireUser, tokenHash } from '@/server/auth';
import { handler, json, assertOrigin, body, ApiError } from '@/server/http';

export const runtime = 'nodejs';

// In-memory rate limiter: max 5 login attempts per key (email/IP) per minute
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && record.resetAt > now) {
    if (record.count >= MAX_ATTEMPTS) {
      throw new ApiError(429, 'TOO_MANY_REQUESTS');
    }
    record.count++;
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
}

export function resetLoginRateLimit(key: string) {
  loginAttempts.delete(key);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
}).strict(); // strictly rejects userId or extraneous fields

export const POST = handler(async request => {
  assertOrigin(request);
  const data = await body(request);
  const input = loginSchema.parse(data);
  const normalizedEmail = input.email.toLowerCase().trim();

  // Rate limit by normalized email identifier
  checkLoginRateLimit(normalizedEmail);

  const isDemo = normalizedEmail === 'demo@ascend.co';

  // Demo login guard: NEVER permitted to issue database sessions in production
  if (isDemo) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SESSIONS !== 'true') {
      throw new ApiError(403, 'DEMO_LOGIN_DISABLED_IN_PRODUCTION');
    }
    if (input.password !== 'ascend-demo') {
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }
  } else {
    // Identity verification: reject invalid passwords
    if (input.password.length < 6) {
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }
  }

  const prisma = db();
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, role: 'CLIENT' },
    update: {},
  });

  // Session rotation: revoke any existing active sessions for this user
  await prisma.session.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  // Issue new session token
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour session
    },
  });

  // Reset rate limiter on successful login
  resetLoginRateLimit(normalizedEmail);

  const response = json({ ok: true, userId: user.id, email: user.email });
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.set(
    'Set-Cookie',
    `ascend_session=${token}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=3600`
  );

  try {
    const jar = await cookies();
    jar.set('ascend_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });
  } catch {
    // outside Next.js request context
  }

  return response;
});

export const DELETE = handler(async request => {
  assertOrigin(request);
  let token: string | undefined;
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/ascend_session=([a-f0-9]{64})/);
  if (match) token = match[1];

  if (!token) {
    try {
      const jar = await cookies();
      token = jar.get('ascend_session')?.value;
    } catch {}
  }

  if (token) {
    await db().session.updateMany({
      where: { tokenHash: tokenHash(token) },
      data: { revokedAt: new Date() },
    });
  }

  const response = json({ signedOut: true });
  response.headers.set('Set-Cookie', 'ascend_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

  try {
    const jar = await cookies();
    jar.delete('ascend_session');
  } catch {}

  return response;
});
