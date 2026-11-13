import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json } from '@/server/http';
import { listInput, type ProgressResponse } from '@/contracts/progress';
import { periodStart } from '@/server/observations';

export const runtime = 'nodejs';

export const GET = handler(async request => {
  const userId = await requireUser(request);
  const q = listInput.parse(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await db().observation.findMany({
    where: { userId, voidedAt: null, metric: q.metric, measuredAt: { gte: periodStart(q.period) } },
    orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
    skip: (q.page - 1) * 100,
    take: 101,
  });
  const result: ProgressResponse = {
    records: rows.slice(0, 100).map(r => ({
      id: r.id,
      metric: r.metric,
      value: Number(r.value),
      measuredAt: r.measuredAt.toISOString(),
    })),
    page: q.page,
    hasMore: rows.length > 100,
    period: q.period,
    metric: q.metric,
  };
  return json(result);
});
