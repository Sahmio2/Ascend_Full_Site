import { z } from 'zod';
import { db } from '@/server/db';
import { handler, json, body, assertOrigin, ApiError } from '@/server/http';
import { verifyAuthChallenge } from '@/server/challenges';
import { issueUserSession } from '@/server/auth';
import { resetLoginRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const data = await body(request);
  const { email, code } = schema.parse(data);
  const normalizedEmail = email.toLowerCase().trim();

  // Verify MFA challenge
  await verifyAuthChallenge({
    identifier: normalizedEmail,
    code,
    type: 'COACH_MFA',
  });

  const prisma = db();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.role !== 'COACH') {
    throw new ApiError(403, 'FORBIDDEN_COACH_ROLE_REQUIRED');
  }

  const session = await issueUserSession(user.id);
  resetLoginRateLimit(`coach:${normalizedEmail}`);

  const response = json({
    ok: true,
    role: 'COACH',
    nextPath: '/coach-portal',
    message: 'Coach MFA authenticated.',
  });

  response.headers.set('Set-Cookie', session.cookieHeader);
  return response;
});
