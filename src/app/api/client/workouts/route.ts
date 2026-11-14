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
      programmeDraft: true,
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

  const effectiveProgramme = activeSession?.programmeDraft || activeProgramme;

  return json({
    ok: true,
    status: effectiveProgramme ? 'ACTIVE' : 'NO_PLAN',
    activeProgramme: effectiveProgramme
      ? {
          id: effectiveProgramme.id,
          version: effectiveProgramme.version,
          training: effectiveProgramme.trainingJson,
        }
      : null,
    activeSession: activeSession
      ? {
          id: activeSession.id,
          workoutId: activeSession.workoutId,
          workoutName: activeSession.workoutName,
          programmeVersion: activeSession.programmeVersion,
          programmeDraftId: activeSession.programmeDraftId,
          startedAt: activeSession.startedAt,
          status: activeSession.status,
          notes: activeSession.notes,
          setLogs: activeSession.setLogs.map((s) => ({
            id: s.id,
            slotId: s.slotId,
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
      setIndex: z.number().int().min(0).max(50),
      isWarmup: z.boolean().default(false),
      weightKg: z
        .union([z.number(), z.string()])
        .refine((val) => {
          const num = Number(val);
          return Number.isFinite(num) && num >= 0 && num <= 1000;
        }, { message: 'Weight must be a non-negative finite number <= 1000 kg' })
        .transform((val) => Number(val)),
      reps: z.number().int().min(0).max(500),
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

    // Defensive deduplication against concurrent start_or_resume calls
    const allInProgress = await prisma.clientWorkoutSession.findMany({
      where: { userId, workoutId: parsed.workoutId, status: 'IN_PROGRESS' },
      include: { setLogs: true },
      orderBy: { startedAt: 'asc' },
    });

    if (allInProgress.length > 1) {
      const canonical = allInProgress[0];
      const duplicates = allInProgress.slice(1);
      await prisma.clientWorkoutSession.deleteMany({
        where: { id: { in: duplicates.map((d) => d.id) } },
      });
      return json({ ok: true, session: canonical, resumed: canonical.id !== session.id });
    }

    return json({ ok: true, session, resumed: false });
  }

  if (parsed.action === 'log_set') {
    const session = await prisma.clientWorkoutSession.findUnique({
      where: { id: parsed.sessionId },
      include: { programmeDraft: true },
    });

    if (!session || session.userId !== userId) {
      throw new ApiError(404, 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'SESSION_ALREADY_CLOSED');
    }

    // Validate exercise swap rules
    if (parsed.isSwap) {
      if (!parsed.targetExerciseId) {
        throw new ApiError(400, 'SWAP_REQUIRES_TARGET_EXERCISE');
      }
      // Check if swap is approved in ExerciseSwap table or approved catalogue
      const approvedSwapInDb = await prisma.exerciseSwap.findFirst({
        where: {
          sourceExerciseId: parsed.targetExerciseId,
          swappedExerciseId: parsed.exerciseId,
          isCoachApproved: true,
        },
      });

      const KNOWN_APPROVED_SWAPS: Record<string, string[]> = {
        leg: ['goblet', 'split'],
        rdl: ['extension'],
        bench: ['machinepress'],
        row: ['chestrow'],
        lat: ['assisted'],
      };

      const isKnownSwap = KNOWN_APPROVED_SWAPS[parsed.targetExerciseId]?.includes(parsed.exerciseId);

      if (!approvedSwapInDb && !isKnownSwap) {
        throw new ApiError(400, 'UNAUTHORIZED_EXERCISE_SWAP');
      }
    } else {
      if (parsed.targetExerciseId && parsed.targetExerciseId !== parsed.exerciseId) {
        throw new ApiError(400, 'MISMATCHED_TARGET_EXERCISE');
      }
    }

    const slotId = parsed.targetExerciseId || parsed.exerciseId;

    // Atomic composite key upsert on (sessionId, slotId, setIndex, isWarmup)
    let setLog;
    try {
      setLog = await prisma.clientWorkoutSetLog.upsert({
        where: {
          sessionId_slotId_setIndex_isWarmup: {
            sessionId: parsed.sessionId,
            slotId,
            setIndex: parsed.setIndex,
            isWarmup: parsed.isWarmup,
          },
        },
        update: {
          exerciseId: parsed.exerciseId,
          exerciseName: parsed.exerciseName,
          targetExerciseId: parsed.targetExerciseId || null,
          isSwap: parsed.isSwap,
          weightKg: new Decimal(parsed.weightKg),
          reps: parsed.reps,
          completed: parsed.completed,
          loggedAt: new Date(),
        },
        create: {
          sessionId: parsed.sessionId,
          slotId,
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
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('Unique constraint failed')) {
        setLog = await prisma.clientWorkoutSetLog.update({
          where: {
            sessionId_slotId_setIndex_isWarmup: {
              sessionId: parsed.sessionId,
              slotId,
              setIndex: parsed.setIndex,
              isWarmup: parsed.isWarmup,
            },
          },
          data: {
            exerciseId: parsed.exerciseId,
            exerciseName: parsed.exerciseName,
            targetExerciseId: parsed.targetExerciseId || null,
            isSwap: parsed.isSwap,
            weightKg: new Decimal(parsed.weightKg),
            reps: parsed.reps,
            completed: parsed.completed,
            loggedAt: new Date(),
          },
        });
      } else {
        throw err;
      }
    }

    return json({ ok: true, setLog });
  }

  if (parsed.action === 'complete_session') {
    const session = await prisma.clientWorkoutSession.findUnique({
      where: { id: parsed.sessionId },
      include: { setLogs: true },
    });

    if (!session || session.userId !== userId) {
      throw new ApiError(404, 'SESSION_NOT_FOUND');
    }

    // Idempotent: if already completed, return existing session without altering completedAt
    if (session.status === 'COMPLETED' || session.status === 'PARTIAL') {
      return json({ ok: true, session, idempotent: true });
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
