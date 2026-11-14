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
  const bs03 = answers['BS-03'];
  const bs04 = answers['BS-04'];
  const bs05 = answers['BS-05'];
  const bs06 = answers['BS-06'];
  const bs07 = answers['BS-07'];

  const safetyReasons: string[] = [];
  if (bs02 === 'Yes') safetyReasons.push('Current pain or injury reported (BS-02: Yes)');
  if (bs02 === 'Unsure') safetyReasons.push('Uncertain movement pain reported (BS-02: Unsure)');
  if (bs02 !== 'No' && (bs03 === 'Yes' || bs03 === 'Unsure')) {
    safetyReasons.push(`Joint red-flag symptom reported (BS-03: ${bs03})`);
  }
  if (['Yes', 'Unsure', 'Prefer private discussion'].includes(bs04)) {
    safetyReasons.push(`Health/medication restriction on food/recovery reported (BS-04: ${bs04})`);
  }
  if (['Yes', 'Unsure'].includes(bs05)) {
    safetyReasons.push(`Recent surgery or hospitalisation reported (BS-05: ${bs05})`);
  }
  if (bs06 === 'Pregnant') safetyReasons.push('Client is currently pregnant (BS-06: Pregnant)');
  if (['Yes', 'Unsure', 'Prefer private discussion'].includes(bs07)) {
    safetyReasons.push(`Food/measurement safety boundary reported (BS-07: ${bs07})`);
  }

  const hasSafetyFlag = safetyReasons.length > 0;

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
      safetyFlags: hasSafetyFlag
        ? { flagged: true, recordedAt: now.toISOString(), reasons: safetyReasons }
        : undefined,
      ...(isSubmitted ? { submittedAt, deliveryDueAt } : {}),
    },
    create: {
      userId,
      status,
      safetyFlags: hasSafetyFlag
        ? { flagged: true, recordedAt: now.toISOString(), reasons: safetyReasons }
        : undefined,
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
