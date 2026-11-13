import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/server/db';
import { requireUser, tokenHash } from '@/server/auth';
import { handler, json, assertOrigin, body, ApiError } from '@/server/http';
import { verifyPassword } from '@/server/passwords';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';

// Constant dummy hash to equalize response times against user enumeration timing attacks
const DUMMY_SCRYPT_HASH =
  'scrypt$N=16384,r=8,p=1$00000000000000000000000000000000$' +
  '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1, 'Password required'),
  })
  .strict(); // strictly rejects userId or extraneous fields

export const POST = handler(async request => {
  assertOrigin(request);
  const data = await body(request);
  const input = loginSchema.parse(data);
  const normalizedEmail = input.email.toLowerCase().trim();

  // Rate limit by normalized email identifier
  checkLoginRateLimit(normalizedEmail);

  // Unconditionally block demo login bypass in production, regardless of ALLOW_DEV_SESSIONS
  if (
    normalizedEmail === 'demo@ascend.co' &&
    (process.env.NODE_ENV === 'production' || process.env.VERCEL)
  ) {
    throw new ApiError(403, 'DEMO_LOGIN_DISABLED_IN_PRODUCTION');
  }

  const prisma = db();

  // Look up user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Fail-closed policy:
  // If user does not exist or has no stored password hash, run dummy scrypt work to resist timing enumeration
  if (!user || !user.passwordHash) {
    await verifyPassword(input.password, DUMMY_SCRYPT_HASH);
    throw new ApiError(401, 'INVALID_CREDENTIALS');
  }

  // Cryptographic per-user password verification
  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS');
  }

  // Session rotation: revoke any existing active sessions for this user
  await prisma.session.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  // Issue new cryptographically random session token (32 bytes = 256 bits of entropy)
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour session
    },
  });

  // Reset rate limiter on successful authentication
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
