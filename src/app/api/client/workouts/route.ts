import { db } from '@/server/db';
import { requireUser } from '@/server/auth';
import { handler, json, body, ApiError, assertOrigin } from '@/server/http';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/client';

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
      include: { membership: true },
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
      activeProgramme: null,
      activeSession: null,
      previousPerformance: {},
      completedSessionsCount: 0,
    });
  }

  // Fetch current in-progress session if any
  const activeSession = await prisma.clientWorkoutSession.findFirst({
    where: { userId, status: 'IN_PROGRESS' },
    include: {
      setLogs: {
        orderBy: { loggedAt: 'asc' },
      },
    },
    orderBy: { startedAt: 'desc' },
  });

  // Fetch previous performance reference for exercises
  const pastSets = await prisma.clientWorkoutSetLog.findMany({
    where: {
      session: { userId, status: 'COMPLETED' },
      isWarmup: false,
      completed: true,
    },
    include: {
      session: { select: { completedAt: true } },
    },
    orderBy: { loggedAt: 'desc' },
    take: 100,
  });

  const previousPerformance: Record<string, { date: string; rows: [string, string][] }> = {};
  for (const set of pastSets) {
    const key = set.targetExerciseId || set.exerciseId;
    if (!previousPerformance[key]) {
      const dateStr = set.session.completedAt
        ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(set.session.completedAt)
        : 'Previous';
      previousPerformance[key] = { date: dateStr, rows: [] };
    }
    if (previousPerformance[key].rows.length < 5) {
      previousPerformance[key].rows.push([set.weightKg.toString(), set.reps.toString()]);
    }
  }

  const completedSessionsCount = await prisma.clientWorkoutSession.count({
    where: { userId, status: { in: ['COMPLETED', 'PARTIAL'] } },
  });

  return json({
    ok: true,
    status: activeProgramme ? 'ACTIVE' : 'NO_PLAN',
    activeProgramme: activeProgramme
      ? {
          id: activeProgramme.id,
          version: activeProgramme.version,
          training: activeProgramme.trainingJson,
        }
      : null,
    activeSession: activeSession
      ? {
          id: activeSession.id,
          workoutId: activeSession.workoutId,
          workoutName: activeSession.workoutName,
          programmeVersion: activeSession.programmeVersion,
          startedAt: activeSession.startedAt,
          status: activeSession.status,
          notes: activeSession.notes,
          setLogs: activeSession.setLogs.map((s) => ({
            id: s.id,
            exerciseId: s.exerciseId,
            exerciseName: s.exerciseName,
            targetExerciseId: s.targetExerciseId,
            isSwap: s.isSwap,
            setIndex: s.setIndex,
            isWarmup: s.isWarmup,
            weightKg: s.weightKg.toString(),
            reps: s.reps,
            completed: s.completed,
          })),
        }
      : null,
    previousPerformance,
    completedSessionsCount,
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

  const schema = z.discriminatedUnion('action', [
    z.object({
      action: z.literal('start_or_resume'),
      workoutId: z.string().min(1),
      workoutName: z.string().min(1),
    }),
    z.object({
      action: z.literal('log_set'),
      sessionId: z.string().min(1),
      exerciseId: z.string().min(1),
      exerciseName: z.string().min(1),
      targetExerciseId: z.string().optional(),
      isSwap: z.boolean().default(false),
      setIndex: z.number().int().min(0),
      isWarmup: z.boolean().default(false),
      weightKg: z.union([z.number(), z.string()]).transform((val) => Number(val) || 0),
      reps: z.number().int().min(0),
      completed: z.boolean().default(true),
    }),
    z.object({
      action: z.literal('complete_session'),
      sessionId: z.string().min(1),
      status: z.enum(['COMPLETED', 'PARTIAL']).default('COMPLETED'),
      notes: z.string().optional(),
    }),
  ]);

  const parsed = schema.parse(raw);

  if (parsed.action === 'start_or_resume') {
    // Check if an IN_PROGRESS session already exists
    const existing = await prisma.clientWorkoutSession.findFirst({
      where: {
        userId,
        workoutId: parsed.workoutId,
        status: 'IN_PROGRESS',
      },
      include: { setLogs: true },
    });

    if (existing) {
      return json({ ok: true, session: existing, resumed: true });
    }

    // Find client's active published programme
    const activeProgramme = await prisma.programmeDraft.findFirst({
      where: { clientUserId: userId, isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });

    const session = await prisma.clientWorkoutSession.create({
      data: {
        userId,
        workoutId: parsed.workoutId,
        workoutName: parsed.workoutName,
        programmeDraftId: activeProgramme?.id || null,
        programmeVersion: activeProgramme?.version || 'Active v1',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: { setLogs: true },
    });

    return json({ ok: true, session, resumed: false });
  }

  if (parsed.action === 'log_set') {
    const session = await prisma.clientWorkoutSession.findUnique({
      where: { id: parsed.sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ApiError(404, 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'SESSION_ALREADY_CLOSED');
    }

    // Check for existing set log
    const existingSet = await prisma.clientWorkoutSetLog.findFirst({
      where: {
        sessionId: parsed.sessionId,
        exerciseId: parsed.exerciseId,
        setIndex: parsed.setIndex,
        isWarmup: parsed.isWarmup,
      },
    });

    const setLog = existingSet
      ? await prisma.clientWorkoutSetLog.update({
          where: { id: existingSet.id },
          data: {
            exerciseName: parsed.exerciseName,
            targetExerciseId: parsed.targetExerciseId || null,
            isSwap: parsed.isSwap,
            weightKg: new Decimal(parsed.weightKg),
            reps: parsed.reps,
            completed: parsed.completed,
            loggedAt: new Date(),
          },
        })
      : await prisma.clientWorkoutSetLog.create({
          data: {
            sessionId: parsed.sessionId,
            exerciseId: parsed.exerciseId,
            exerciseName: parsed.exerciseName,
            targetExerciseId: parsed.targetExerciseId || null,
            isSwap: parsed.isSwap,
            setIndex: parsed.setIndex,
            isWarmup: parsed.isWarmup,
            weightKg: new Decimal(parsed.weightKg),
            reps: parsed.reps,
            completed: parsed.completed,
            loggedAt: new Date(),
          },
        });

    return json({ ok: true, setLog });
  }

  if (parsed.action === 'complete_session') {
    const session = await prisma.clientWorkoutSession.findUnique({
      where: { id: parsed.sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ApiError(404, 'SESSION_NOT_FOUND');
    }

    const updated = await prisma.clientWorkoutSession.update({
      where: { id: parsed.sessionId },
      data: {
        status: parsed.status,
        completedAt: new Date(),
        notes: parsed.notes || session.notes,
      },
      include: { setLogs: true },
    });

    return json({ ok: true, session: updated });
  }

  throw new ApiError(400, 'INVALID_ACTION');
});
