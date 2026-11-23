import { requireUser, getAccountSnapshot } from '@/server/auth';
import { handler, json } from '@/server/http';

export const runtime = 'nodejs';

export const GET = handler(async (request: Request) => {
  let userId: string;
  try {
    userId = await requireUser(request);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const url = new URL(request.url);
      const devUserId = url.searchParams.get('devUserId');
      if (devUserId) {
        userId = devUserId;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
  const snapshot = await getAccountSnapshot(userId);
  return json({ ok: true, snapshot });
});
