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

  return json({ ok: true, assessment });
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

  const hasSafetyFlag =
    answers['BS-02'] === 'Yes' ||
    answers['BS-03'] === 'Yes' ||
    answers['BS-06'] === 'Pregnant' ||
    answers['BS-07'] === 'Yes';

  const now = new Date();
  const deliveryDueAt = isSubmitted ? calculateFiveBusinessDays(now) : undefined;
  const status = isSubmitted
    ? hasSafetyFlag
      ? 'SAFETY_HELD'
      : 'SUBMITTED'
    : 'IN_PROGRESS';

  const assessment = await prisma.clientAssessment.upsert({
    where: { userId },
    update: {
      status,
      safetyFlags: hasSafetyFlag ? { flagged: true, recordedAt: now.toISOString() } : undefined,
      ...(isSubmitted ? { submittedAt: now, deliveryDueAt } : {}),
    },
    create: {
      userId,
      status,
      safetyFlags: hasSafetyFlag ? { flagged: true, recordedAt: now.toISOString() } : undefined,
      ...(isSubmitted ? { submittedAt: now, deliveryDueAt } : {}),
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
