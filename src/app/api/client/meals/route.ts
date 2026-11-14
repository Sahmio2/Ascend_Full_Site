import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, body, ApiError, assertOrigin } from '@/server/http';
import { z } from 'zod';
import { MealType, MealStatus } from '@/generated/prisma/enums';

export const runtime = 'nodejs';

function isValidCalendarDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

const CustomFoodSchema = z.object({
  name: z.string().min(1),
  grams: z.number().nonnegative(),
  state: z.string().optional(),
  kcal: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  isEstimated: z.boolean().optional(),
});

function getLagosDateString(d = new Date()): string {
  // Lagos is Africa/Lagos (UTC+1, no DST)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(d);
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
    date: z.string().refine(isValidCalendarDate, { message: 'INVALID_CALENDAR_DATE' }).default(() => getLagosDateString()),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    mealName: z.string().min(1),
    status: z.enum(['PLANNED', 'CHANGED', 'SKIPPED', 'NOT_RECORDED']),
    customFoods: z.array(CustomFoodSchema).optional(),
    notes: z.string().optional(),
  });

  const parsed = schema.parse(raw);

  // If status is NOT_RECORDED, remove record if present and record audit event
  if (parsed.status === 'NOT_RECORDED') {
    const existing = await prisma.dailyMealLog.findUnique({
      where: {
        userId_date_mealType: {
          userId,
          date: parsed.date,
          mealType: parsed.mealType as MealType,
        },
      },
    });

    if (existing) {
      await prisma.mealAuditLog.create({
        data: {
          userId,
          date: parsed.date,
          mealType: parsed.mealType as MealType,
          action: 'RESET_NOT_RECORDED',
          previousStatus: existing.status,
          newStatus: 'NOT_RECORDED',
          programmeVersion: existing.programmeVersion,
          payload: { mealName: existing.mealName, customFoods: existing.customFoods },
        },
      });

      await prisma.dailyMealLog.delete({
        where: { id: existing.id },
      });
    }

    return json({
      ok: true,
      status: 'NOT_RECORDED',
      date: parsed.date,
      mealType: parsed.mealType,
    });
  }

  // Fetch client's active published programme for version stamping if creating new
  const activeProgramme = await prisma.programmeDraft.findFirst({
    where: { clientUserId: userId, isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });

  const mealStatusEnum = parsed.status as MealStatus;
  const now = new Date();

  // Find if already exists to preserve historical programmeDraftId on update
  const existingMeal = await prisma.dailyMealLog.findUnique({
    where: {
      userId_date_mealType: {
        userId,
        date: parsed.date,
        mealType: parsed.mealType as MealType,
      },
    },
  });

  const mealLog = existingMeal
    ? await prisma.dailyMealLog.update({
        where: { id: existingMeal.id },
        data: {
          mealName: parsed.mealName,
          status: mealStatusEnum,
          customFoods: parsed.customFoods ?? undefined,
          notes: parsed.notes ?? undefined,
          // Retain original programmeDraftId & programmeVersion
          recordedAt: now,
        },
      })
    : await prisma.dailyMealLog.create({
        data: {
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

  // Record audit log entry
  await prisma.mealAuditLog.create({
    data: {
      userId,
      date: parsed.date,
      mealType: parsed.mealType as MealType,
      action: existingMeal ? 'UPDATED' : 'CREATED',
      previousStatus: existingMeal?.status || null,
      newStatus: mealStatusEnum,
      programmeVersion: mealLog.programmeVersion,
      payload: { mealName: mealLog.mealName, customFoods: mealLog.customFoods },
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
