import { z } from 'zod';
import { db } from '@/server/db';
import { handler, json, body, assertOrigin } from '@/server/http';
import { verifyAuthChallenge } from '@/server/challenges';
import { issueUserSession, getAccountSnapshot } from '@/server/auth';
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

  // Verify challenge
  await verifyAuthChallenge({
    identifier: normalizedEmail,
    code,
    type: 'CLIENT_EMAIL_OTP',
  });

  const prisma = db();

  // Find or create single user record
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        role: 'CLIENT',
      },
    });
  }

  // Issue server session and get authoritative state
  const session = await issueUserSession(user.id);
  const snapshot = await getAccountSnapshot(user.id);
  resetLoginRateLimit(normalizedEmail);

  const response = json({
    ok: true,
    userId: user.id,
    email: user.email,
    nextPath: snapshot.statusActionPath,
    snapshot,
  });

  response.headers.set('Set-Cookie', session.cookieHeader);
  return response;
});
