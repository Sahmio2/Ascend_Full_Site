import { db } from '@/server/db';
import { requireCoach } from '@/server/auth';
import { dynamicHandler, json, ApiError } from '@/server/http';

export const runtime = 'nodejs';

async function resolveClientId(request: Request, context: { params: Promise<{ id: string }> }): Promise<string> {
  const p = await context.params;
  if (p?.id) return p.id;
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const id = parts[parts.length - 1];
  if (!id) throw new ApiError(400, 'CLIENT_ID_REQUIRED');
  return id;
}

export const GET = dynamicHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  await requireCoach(request);
  const clientId = await resolveClientId(request, context);
  const prisma = db();

  const user = await prisma.user.findUnique({
    where: { id: clientId },
    include: {
      screening: true,
      assessment: {
        include: {
          stages: true,
        },
      },
      programmes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'CLIENT_NOT_FOUND');
  }

  // Merge stage answers into a flat dictionary
  const answers: Record<string, any> = {};
  if (user.assessment?.stages) {
    for (const stage of user.assessment.stages) {
      if (stage.data && typeof stage.data === 'object') {
        Object.assign(answers, stage.data);
      }
    }
  }

  const hasSafetyFlag = Boolean(
    user.assessment?.safetyFlags &&
      typeof user.assessment.safetyFlags === 'object' &&
      (user.assessment.safetyFlags as any).flagged
  );

  return json({
    ok: true,
    client: {
      id: user.id,
      email: user.email,
      name: user.screening?.firstName || user.email.split('@')[0],
      screening: user.screening,
    },
    assessment: user.assessment
      ? {
          id: user.assessment.id,
          status: user.assessment.status,
          safetyFlags: user.assessment.safetyFlags,
          deliveryDueAt: user.assessment.deliveryDueAt,
          submittedAt: user.assessment.submittedAt,
          createdAt: user.assessment.createdAt,
          hasSafetyFlag,
        }
      : null,
    stages: user.assessment?.stages || [],
    answers,
    programmes: user.programmes,
  });
});
