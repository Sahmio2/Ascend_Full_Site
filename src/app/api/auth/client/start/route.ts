import { z } from 'zod';
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

  // Rate limit by email
  checkLoginRateLimit(normalizedEmail);

  // Issue 6-digit OTP challenge
  const result = await createAuthChallenge({
    identifier: normalizedEmail,
    type: 'CLIENT_EMAIL_OTP',
  });

  return json({
    ok: true,
    message: 'Verification code sent to your email address.',
    expiresAt: result.expiresAt.toISOString(),
    // Include devCode only in test/development for test assertions
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
});
