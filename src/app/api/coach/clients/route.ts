import { db } from '@/server/db';
import { requireCoach } from '@/server/auth';
import { handler, json } from '@/server/http';
import { getCapacityStatus } from '@/server/capacity';

export const runtime = 'nodejs';

const VARIANTS: Array<'rose' | 'green' | 'violet' | 'blue' | 'orange'> = [
  'rose',
  'green',
  'violet',
  'blue',
  'orange',
];

export const GET = handler(async (request: Request) => {
  await requireCoach(request);
  const prisma = db();

  const [users, capacity] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        screening: true,
        assessment: {
          include: { stages: true },
        },
        membership: true,
        programmes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getCapacityStatus(),
  ]);

  const clients = users.map((u, index) => {
    const screening = u.screening;
    const assessment = u.assessment;
    const publishedPlan = u.programmes.find((p) => p.isPublished);
    const latestDraft = u.programmes.find((p) => !p.isPublished);

    const name = screening?.firstName
      ? `${screening.firstName} ${u.email.split('@')[0] === screening.firstName ? '' : ''}`.trim()
      : u.email.split('@')[0];

    const short = name
      .split(' ')
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || u.email.slice(0, 2).toUpperCase();

    const variant = VARIANTS[index % VARIANTS.length];
    const goal = screening?.mainGoal || 'Physique development';

    let status = 'Registered';
    let statusTone: 'red' | 'amber' | 'green' | 'neutral' = 'neutral';
    let kind = 'New client';

    if (assessment?.status === 'SAFETY_HELD') {
      status = 'Safety hold';
      statusTone = 'red';
      kind = 'Safety review required';
    } else if (assessment?.status === 'SUBMITTED') {
      status = 'Awaiting review';
      statusTone = 'amber';
      kind = 'Assessment complete';
    } else if (publishedPlan) {
      status = 'Active';
      statusTone = 'green';
      kind = 'Coaching active';
    } else if (latestDraft) {
      status = 'Draft in progress';
      statusTone = 'amber';
      kind = `Draft ${latestDraft.version}`;
    } else if (assessment?.status === 'IN_PROGRESS') {
      status = 'Intake in progress';
      statusTone = 'neutral';
      kind = 'Stage intake started';
    }

    const plan = publishedPlan
      ? `Active ${publishedPlan.version}`
      : latestDraft
      ? `Draft ${latestDraft.version}`
      : 'Not active';

    const hasSafetyFlag = Boolean(
      assessment?.safetyFlags &&
        typeof assessment.safetyFlags === 'object' &&
        (assessment.safetyFlags as any).flagged
    );

    return {
      id: u.id,
      email: u.email,
      name,
      short,
      variant,
      goal,
      phase: publishedPlan ? 'Tame the Flesh' : 'Foundation',
      status,
      statusTone,
      plan,
      review: assessment?.deliveryDueAt ? assessment.deliveryDueAt.toISOString() : '—',
      kind,
      days: screening?.daysPerWeek || '3 days',
      assessmentStatus: assessment?.status || 'NOT_STARTED',
      deliveryDueAt: assessment?.deliveryDueAt ? assessment.deliveryDueAt.toISOString() : null,
      submittedAt: assessment?.submittedAt ? assessment.submittedAt.toISOString() : null,
      hasSafetyFlag,
    };
  });

  return json({
    ok: true,
    clients,
    capacity: {
      activeClients: capacity.totalSeatsClaimed,
      maxActiveClients: capacity.policy.maxActiveClients,
      weeklyOnboardings: capacity.weeklyOnboardingsCount,
      maxWeeklyOnboardings: capacity.policy.maxWeeklyOnboardings,
    },
  });
});
