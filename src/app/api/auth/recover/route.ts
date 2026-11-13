import { z } from 'zod';
import { db } from '@/server/db';
import { handler, json, body, assertOrigin } from '@/server/http';
import { createAuthChallenge } from '@/server/challenges';
import { checkLoginRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const data = await body(request);
  const { email } = schema.parse(data);
  const normalizedEmail = email.toLowerCase().trim();

  checkLoginRateLimit(normalizedEmail);

  const prisma = db();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always issue challenge or simulate to preserve anti-enumeration
  let devCode: string | undefined;
  if (user) {
    const res = await createAuthChallenge({
      identifier: normalizedEmail,
      type: 'CLIENT_EMAIL_OTP',
    });
    devCode = res.devCode;
  } else {
    // Artificial small delay to equalize timing against timing attacks
    await new Promise((r) => setTimeout(r, 60));
  }

  return json({
    ok: true,
    nextPath: '/verify-email',
    message: 'If an account is associated with this email, a sign-in code has been sent.',
    ...(devCode ? { devCode } : {}),
  });
});
