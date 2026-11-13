import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { requireUser,tokenHash } from '@/server/auth';
import { handler,json,assertOrigin } from '@/server/http';
export const runtime='nodejs';
export const DELETE=handler(async request=>{assertOrigin(request);await requireUser();const jar=await cookies();const token=jar.get('ascend_session')!.value;await db().session.update({where:{tokenHash:tokenHash(token)},data:{revokedAt:new Date()}});jar.delete('ascend_session');return json({signedOut:true})});
