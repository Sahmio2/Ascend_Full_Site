import { z } from 'zod';
import { db } from '@/server/db';
import { handler, json, body, assertOrigin, ApiError } from '@/server/http';
import { verifyPassword } from '@/server/passwords';
import { createAuthChallenge } from '@/server/challenges';
import { checkLoginRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';

const DUMMY_SCRYPT_HASH =
  'scrypt$N=16384,r=8,p=1$00000000000000000000000000000000$' +
  '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const data = await body(request);
  const { email, password } = schema.parse(data);
  const normalizedEmail = email.toLowerCase().trim();

  checkLoginRateLimit(`coach:${normalizedEmail}`);

  const prisma = db();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Verify coach role and credentials fail-closed
  if (!user || user.role !== 'COACH' || !user.passwordHash) {
    await verifyPassword(password, DUMMY_SCRYPT_HASH);
    throw new ApiError(401, 'INVALID_COACH_CREDENTIALS');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'INVALID_COACH_CREDENTIALS');
  }

  // Issue Coach MFA challenge
  const result = await createAuthChallenge({
    identifier: normalizedEmail,
    type: 'COACH_MFA',
  });

  return json({
    ok: true,
    nextPath: '/coach/verify',
    message: 'Coach credentials verified. Enter the 6-digit MFA code to complete login.',
    expiresAt: result.expiresAt.toISOString(),
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
});
