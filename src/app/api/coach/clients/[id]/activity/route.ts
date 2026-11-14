import { db } from '@/server/db';
import { requireCoach } from '@/server/auth';
import { dynamicHandler, json, ApiError } from '@/server/http';

export const runtime = 'nodejs';

async function resolveClientId(request: Request, context: { params: Promise<{ id: string }> }): Promise<string> {
  const p = await context.params;
  if (p?.id) return p.id;
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const activityIndex = parts.indexOf('activity');
  const id = activityIndex > 0 ? parts[activityIndex - 1] : parts[parts.length - 1];
  if (!id) throw new ApiError(400, 'CLIENT_ID_REQUIRED');
  return id;
}

export const GET = dynamicHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  await requireCoach(request);
  const clientId = await resolveClientId(request, context);
  const prisma = db();

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    include: {
      programmes: {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!client || client.role !== 'CLIENT') {
    throw new ApiError(404, 'CLIENT_NOT_FOUND');
  }

  const activeProgramme = client.programmes[0] || null;

  const [sessions, mealLogs] = await Promise.all([
    prisma.clientWorkoutSession.findMany({
      where: { userId: clientId },
      include: {
        setLogs: {
          orderBy: { setIndex: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    }),
    prisma.dailyMealLog.findMany({
      where: { userId: clientId },
      orderBy: { date: 'desc' },
      take: 60,
    }),
  ]);

  const totalSessionsCompleted = sessions.filter((s) => s.status === 'COMPLETED').length;
  const totalSessionsPartial = sessions.filter((s) => s.status === 'PARTIAL').length;
  const totalMealsPlanned = mealLogs.filter((m) => m.status === 'PLANNED').length;
  const totalMealsChanged = mealLogs.filter((m) => m.status === 'CHANGED').length;
  const totalMealsSkipped = mealLogs.filter((m) => m.status === 'SKIPPED').length;

  return json({
    ok: true,
    clientId,
    activeProgrammeVersion: activeProgramme?.version || null,
    workoutSessions: sessions.map((s) => ({
      id: s.id,
      workoutId: s.workoutId,
      workoutName: s.workoutName,
      programmeVersion: s.programmeVersion,
      programmeDraftId: s.programmeDraftId,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      notes: s.notes,
      setLogs: s.setLogs.map((sl) => ({
        id: sl.id,
        exerciseId: sl.exerciseId,
        exerciseName: sl.exerciseName,
        targetExerciseId: sl.targetExerciseId,
        isSwap: sl.isSwap,
        setIndex: sl.setIndex,
        isWarmup: sl.isWarmup,
        weightKg: sl.weightKg.toString(),
        reps: sl.reps,
        completed: sl.completed,
      })),
    })),
    mealLogs: mealLogs.map((m) => ({
      id: m.id,
      date: m.date,
      mealType: m.mealType,
      mealName: m.mealName,
      status: m.status,
      customFoods: m.customFoods,
      programmeVersion: m.programmeVersion,
      programmeDraftId: m.programmeDraftId,
      recordedAt: m.recordedAt,
    })),
    signals: {
      totalSessionsCompleted,
      totalSessionsPartial,
      totalMealsPlanned,
      totalMealsChanged,
      totalMealsSkipped,
    },
  });
});
