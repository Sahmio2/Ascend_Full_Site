import { z } from 'zod';
import { handler, json, body, assertOrigin } from '@/server/http';
import { createAuthChallenge } from '@/server/challenges';
import { checkLoginRateLimit } from '@/server/rateLimit';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  type: z.enum(['CLIENT_EMAIL_OTP', 'COACH_MFA']).default('CLIENT_EMAIL_OTP'),
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const data = await body(request);
  const { email, type } = schema.parse(data);
  const normalizedEmail = email.toLowerCase().trim();

  checkLoginRateLimit(normalizedEmail);

  const result = await createAuthChallenge({
    identifier: normalizedEmail,
    type,
  });

  return json({
    ok: true,
    message: 'A new code has been sent.',
    expiresAt: result.expiresAt.toISOString(),
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
});
