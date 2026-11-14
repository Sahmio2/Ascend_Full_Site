import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, body, ApiError, assertOrigin } from '@/server/http';
import { z } from 'zod';
import { MealType, MealStatus } from '@/generated/prisma/enums';

export const runtime = 'nodejs';

function getLagosDateString(d = new Date()): string {
  // Lagos is UTC+1
  const lagosOffsetMs = 60 * 60 * 1000;
  const lagosTime = new Date(d.getTime() + lagosOffsetMs);
  return lagosTime.toISOString().slice(0, 10);
}

export const GET = handler(async (request: Request) => {
  const userId = await requireUser(request);
  const prisma = db();

  const url = new URL(request.url);
  const date = url.searchParams.get('date') || getLagosDateString();

  const [assessment, activeProgramme, user, loggedMeals] = await Promise.all([
    prisma.clientAssessment.findUnique({ where: { userId } }),
    prisma.programmeDraft.findFirst({
      where: { clientUserId: userId, isPublished: true },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: { membership: true },
    }),
    prisma.dailyMealLog.findMany({
      where: { userId, date },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND');
  }

  if (assessment?.status === 'SAFETY_HELD') {
    return json({
      ok: true,
      status: 'SAFETY_HELD',
      message: 'Active coaching is on hold for safety review.',
      date,
      activeProgramme: null,
      loggedMeals: [],
    });
  }

  return json({
    ok: true,
    date,
    activeProgramme: activeProgramme
      ? {
          id: activeProgramme.id,
          version: activeProgramme.version,
          nutrition: activeProgramme.nutritionJson,
        }
      : null,
    loggedMeals: loggedMeals.map((l) => ({
      id: l.id,
      date: l.date,
      mealType: l.mealType,
      mealName: l.mealName,
      status: l.status,
      customFoods: l.customFoods,
      programmeVersion: l.programmeVersion,
      programmeDraftId: l.programmeDraftId,
      notes: l.notes,
      recordedAt: l.recordedAt,
    })),
  });
});

export const POST = handler(async (request: Request) => {
  assertOrigin(request);
  const userId = await requireUser(request);
  const raw = await body(request);
  const prisma = db();

  const assessment = await prisma.clientAssessment.findUnique({ where: { userId } });
  if (assessment?.status === 'SAFETY_HELD') {
    throw new ApiError(403, 'SAFETY_HOLD_ACTIVE');
  }

  const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => getLagosDateString()),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    mealName: z.string().min(1),
    status: z.enum(['PLANNED', 'CHANGED', 'SKIPPED', 'NOT_RECORDED']),
    customFoods: z.any().optional(),
    notes: z.string().optional(),
  });

  const parsed = schema.parse(raw);

  // If status is NOT_RECORDED, remove record if present
  if (parsed.status === 'NOT_RECORDED') {
    await prisma.dailyMealLog.deleteMany({
      where: {
        userId,
        date: parsed.date,
        mealType: parsed.mealType as MealType,
      },
    });

    return json({
      ok: true,
      status: 'NOT_RECORDED',
      date: parsed.date,
      mealType: parsed.mealType,
    });
  }

  // Fetch client's active published programme for version stamping
  const activeProgramme = await prisma.programmeDraft.findFirst({
    where: { clientUserId: userId, isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });

  const mealStatusEnum = parsed.status as MealStatus;
  const now = new Date();

  const mealLog = await prisma.dailyMealLog.upsert({
    where: {
      userId_date_mealType: {
        userId,
        date: parsed.date,
        mealType: parsed.mealType as MealType,
      },
    },
    update: {
      mealName: parsed.mealName,
      status: mealStatusEnum,
      customFoods: parsed.customFoods ?? undefined,
      notes: parsed.notes ?? undefined,
      programmeDraftId: activeProgramme?.id || null,
      programmeVersion: activeProgramme?.version || 'Active v1',
      recordedAt: now,
    },
    create: {
      userId,
      date: parsed.date,
      mealType: parsed.mealType as MealType,
      mealName: parsed.mealName,
      status: mealStatusEnum,
      customFoods: parsed.customFoods ?? undefined,
      notes: parsed.notes ?? undefined,
      programmeDraftId: activeProgramme?.id || null,
      programmeVersion: activeProgramme?.version || 'Active v1',
      recordedAt: now,
    },
  });

  return json({
    ok: true,
    mealLog: {
      id: mealLog.id,
      date: mealLog.date,
      mealType: mealLog.mealType,
      mealName: mealLog.mealName,
      status: mealLog.status,
      customFoods: mealLog.customFoods,
      programmeVersion: mealLog.programmeVersion,
      programmeDraftId: mealLog.programmeDraftId,
      recordedAt: mealLog.recordedAt,
    },
  });
});
