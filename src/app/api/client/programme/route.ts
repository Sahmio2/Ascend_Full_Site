import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json } from '@/server/http';

export const runtime = 'nodejs';

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const prisma = db();

  const [assessment, activeProgramme, user] = await Promise.all([
    prisma.clientAssessment.findUnique({ where: { userId } }),
    prisma.programmeDraft.findFirst({
      where: { clientUserId: userId, isPublished: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: { screening: true, membership: true },
    }),
  ]);

  if (!user) {
    return json({ ok: false, error: 'USER_NOT_FOUND' }, 404);
  }

  if (assessment?.status === 'SAFETY_HELD') {
    return json({
      ok: true,
      status: 'SAFETY_HELD',
      message: 'A coaching safety restriction is being reviewed.',
      programme: null,
    });
  }

  if (assessment?.status === 'SUBMITTED' && !activeProgramme) {
    return json({
      ok: true,
      status: 'AWAITING_REVIEW',
      message: 'Your completed assessment has been received. Coach Sahmi is reviewing your programme.',
      deliveryDueAt: assessment.deliveryDueAt,
      programme: null,
    });
  }

  if (!activeProgramme) {
    return json({
      ok: true,
      status: 'NO_PLAN',
      message: 'No published programme currently active.',
      programme: null,
    });
  }

  return json({
    ok: true,
    status: 'ACTIVE',
    programme: {
      id: activeProgramme.id,
      version: activeProgramme.version,
      publishedAt: activeProgramme.publishedAt,
      training: activeProgramme.trainingJson,
      nutrition: activeProgramme.nutritionJson,
      coachNotes: activeProgramme.coachNotes,
    },
  });
});
