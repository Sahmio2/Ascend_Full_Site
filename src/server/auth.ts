import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { db } from './db';
import { ApiError } from './http';

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export function sessionIsActive(session: { expiresAt: Date; revokedAt: Date | null } | null, now = new Date()) {
  return !!session && !session.revokedAt && session.expiresAt > now;
}

export async function requireUser(request?: Request) {
  let token: string | undefined;
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/ascend_session=([a-f0-9]{64})/);
    if (match) token = match[1];
  }
  if (!token) {
    try {
      const jar = await cookies();
      token = jar.get('ascend_session')?.value;
    } catch {
      // outside Next.js request context
    }
  }
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, 'UNAUTHENTICATED');
  const session = await db().session.findUnique({ where: { tokenHash: tokenHash(token) } });
  if (!sessionIsActive(session)) throw new ApiError(401, 'UNAUTHENTICATED');
  return session!.userId;
}
