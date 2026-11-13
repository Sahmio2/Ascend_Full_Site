import { requireUser, getAccountSnapshot } from '@/server/auth';
import { handler, json } from '@/server/http';

export const runtime = 'nodejs';

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const snapshot = await getAccountSnapshot(userId);
  return json({ ok: true, snapshot });
});
