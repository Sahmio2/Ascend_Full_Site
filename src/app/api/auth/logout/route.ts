import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { tokenHash } from '@/server/auth';
import { handler, json, assertOrigin } from '@/server/http';

export const runtime = 'nodejs';

export const POST = handler(async (request: Request) => {
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

  const response = json({ ok: true, signedOut: true });
  response.headers.set('Set-Cookie', 'ascend_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

  try {
    const jar = await cookies();
    jar.delete('ascend_session');
  } catch {}

  return response;
});
