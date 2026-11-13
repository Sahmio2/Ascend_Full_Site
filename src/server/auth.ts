import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { db } from './db';
import { ApiError } from './http';
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function sessionIsActive(session:{expiresAt:Date;revokedAt:Date|null}|null,now=new Date()){return !!session&&!session.revokedAt&&session.expiresAt>now}
export async function requireUser(){
  const token=(await cookies()).get('ascend_session')?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))throw new ApiError(401,'UNAUTHENTICATED');
  const session=await db().session.findUnique({where:{tokenHash:tokenHash(token)}});
  if(!sessionIsActive(session))throw new ApiError(401,'UNAUTHENTICATED');
  return session!.userId;
}
