import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/server/db';
import { requireUser, tokenHash } from '@/server/auth';
import { handler, json, assertOrigin, body } from '@/server/http';

export const runtime = 'nodejs';

export const POST = handler(async request => {
  assertOrigin(request);
  const data = await body(request);
  const { email } = z.object({ email: z.string().email() }).parse(data);
  const prisma = db();
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), role: 'CLIENT' },
    update: {},
  });
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });
  const jar = await cookies();
  jar.set('ascend_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 86400,
  });
  return json({ ok: true, userId: user.id, email: user.email });
});

export const DELETE = handler(async request => {
  assertOrigin(request);
  await requireUser();
  const jar = await cookies();
  const token = jar.get('ascend_session')!.value;
  await db().session.update({
    where: { tokenHash: tokenHash(token) },
    data: { revokedAt: new Date() },
  });
  jar.delete('ascend_session');
  return json({ signedOut: true });
});
