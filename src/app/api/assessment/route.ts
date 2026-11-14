import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, body, assertOrigin } from '@/server/http';
import { z } from 'zod';

export const runtime = 'nodejs';

function calculateFiveBusinessDays(startDate = new Date()): Date {
  const result = new Date(startDate);
  let daysAdded = 0;
  while (daysAdded < 5) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      // Not Saturday (6) or Sunday (0)
      daysAdded++;
    }
  }
  return result;
}

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const prisma = db();

  const assessment = await prisma.clientAssessment.findUnique({
    where: { userId },
    include: { stages: true },
  });

  const answers: Record<string, any> = {};
  if (assessment?.stages) {
    for (const stage of assessment.stages) {
      if (stage.data && typeof stage.data === 'object') {
        Object.assign(answers, stage.data);
      }
    }
  }

  const isSubmitted =
    assessment?.status === 'SUBMITTED' ||
    assessment?.status === 'APPROVED' ||
    assessment?.status === 'SAFETY_HELD';

  return json({
    ok: true,
    assessment: assessment
      ? {
          id: assessment.id,
          status: assessment.status,
          isSubmitted,
          submittedAt: assessment.submittedAt,
          deliveryDueAt: assessment.deliveryDueAt,
        }
      : null,
    answers,
  });
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const userId = await requireUser(request);
  const raw = await body(request);
  const prisma = db();

  const { answers, isSubmitted } = z
    .object({
      answers: z.record(z.string(), z.any()),
      isSubmitted: z.boolean().optional().default(false),
    })
    .parse(raw);

  const bs02 = answers['BS-02'];
  const hasSafetyFlag =
    bs02 === 'Yes' ||
    (bs02 !== 'No' && answers['BS-03'] === 'Yes') ||
    answers['BS-06'] === 'Pregnant' ||
    answers['BS-07'] === 'Yes';

  const existing = await prisma.clientAssessment.findUnique({
    where: { userId },
  });

  const now = new Date();
  const previouslySubmitted = Boolean(existing?.submittedAt);
  const alreadyApproved = existing?.status === 'APPROVED';

  const deliveryDueAt = isSubmitted
    ? previouslySubmitted && existing?.deliveryDueAt
      ? existing.deliveryDueAt
      : calculateFiveBusinessDays(now)
    : undefined;

  const status = alreadyApproved
    ? 'APPROVED'
    : isSubmitted
    ? hasSafetyFlag
      ? 'SAFETY_HELD'
      : 'SUBMITTED'
    : existing?.status === 'SUBMITTED' || existing?.status === 'SAFETY_HELD'
    ? existing.status
    : 'IN_PROGRESS';

  const submittedAt = isSubmitted
    ? previouslySubmitted && existing?.submittedAt
      ? existing.submittedAt
      : now
    : existing?.submittedAt;

  const assessment = await prisma.clientAssessment.upsert({
    where: { userId },
    update: {
      status,
      safetyFlags: hasSafetyFlag ? { flagged: true, recordedAt: now.toISOString() } : undefined,
      ...(isSubmitted ? { submittedAt, deliveryDueAt } : {}),
    },
    create: {
      userId,
      status,
      safetyFlags: hasSafetyFlag ? { flagged: true, recordedAt: now.toISOString() } : undefined,
      ...(isSubmitted ? { submittedAt, deliveryDueAt } : {}),
    },
  });

  // Group stage answers by stage prefix if available
  const stageCodes = ['FT', 'BS', 'FS', 'TC', 'GB', 'MF', 'TR', 'RL', 'PP'];
  for (const code of stageCodes) {
    const stageData: Record<string, any> = {};
    for (const [k, v] of Object.entries(answers)) {
      if (k.startsWith(code)) {
        stageData[k] = v;
      }
    }
    if (Object.keys(stageData).length > 0) {
      await prisma.assessmentStageData.upsert({
        where: {
          assessmentId_stageCode: {
            assessmentId: assessment.id,
            stageCode: code,
          },
        },
        update: {
          data: stageData,
          completedAt: isSubmitted ? now : undefined,
        },
        create: {
          assessmentId: assessment.id,
          stageCode: code,
          data: stageData,
          completedAt: isSubmitted ? now : undefined,
        },
      });
    }
  }

  return json({
    ok: true,
    assessment: {
      id: assessment.id,
      status: assessment.status,
      deliveryDueAt: assessment.deliveryDueAt,
      hasSafetyFlag,
    },
  });
});
