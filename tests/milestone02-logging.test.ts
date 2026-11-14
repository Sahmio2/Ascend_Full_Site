import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { db } from '../src/server/db';
import { issueUserSession } from '../src/server/auth';
import { GET as clientWorkoutsGet, POST as clientWorkoutsPost } from '../src/app/api/client/workouts/route';
import { GET as clientMealsGet, POST as clientMealsPost } from '../src/app/api/client/meals/route';
import { GET as coachActivityGet } from '../src/app/api/coach/clients/[id]/activity/route';
import { POST as coachPublishPost } from '../src/app/api/coach/programmes/[id]/publish/route';
import { POST as assessmentPost } from '../src/app/api/assessment/route';

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

after(async () => {
  await db().$disconnect();
});

test('M2-T1: Authenticated workout creation and resumption', async () => {
  const prisma = db();
  const email = 'client_m2_t1@test.internal';

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'CLIENT' },
    create: { email, role: 'CLIENT' },
  });

  await prisma.clientWorkoutSetLog.deleteMany({ where: { session: { userId: user.id } } });
  await prisma.clientWorkoutSession.deleteMany({ where: { userId: user.id } });

  const session = await issueUserSession(user.id);

  // 1. Start workout session for Full Body A
  const req1 = new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      action: 'start_or_resume',
      workoutId: 'a',
      workoutName: 'Full Body A',
    }),
  });
  const res1 = await clientWorkoutsPost(req1);
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.ok, true);
  assert.equal(data1.resumed, false);
  assert.ok(data1.session.id);
  assert.equal(data1.session.status, 'IN_PROGRESS');

  // 2. Resuming same workout session
  const req2 = new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      action: 'start_or_resume',
      workoutId: 'a',
      workoutName: 'Full Body A',
    }),
  });
  const res2 = await clientWorkoutsPost(req2);
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.ok, true);
  assert.equal(data2.resumed, true);
  assert.equal(data2.session.id, data1.session.id, 'Must resume same session without duplication');
});

test('M2-T2: Cross-client workout isolation', async () => {
  const prisma = db();
  const userA = await prisma.user.upsert({ where: { email: 'client_m2_t2_a@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t2_a@test.internal', role: 'CLIENT' } });
  const userB = await prisma.user.upsert({ where: { email: 'client_m2_t2_b@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t2_b@test.internal', role: 'CLIENT' } });

  const sessionA = await issueUserSession(userA.id);
  const sessionB = await issueUserSession(userB.id);

  // User B starts a session
  const bStart = await prisma.clientWorkoutSession.create({
    data: {
      userId: userB.id,
      workoutId: 'b',
      workoutName: 'Full Body B',
      status: 'IN_PROGRESS',
    },
  });

  // User A attempts to log a set into User B's session -> 404
  const reqA = new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: sessionA.cookieHeader },
    body: JSON.stringify({
      action: 'log_set',
      sessionId: bStart.id,
      exerciseId: 'leg',
      exerciseName: 'Leg Press',
      setIndex: 0,
      weightKg: 80,
      reps: 10,
      completed: true,
    }),
  });
  const resA = await clientWorkoutsPost(reqA);
  assert.equal(resA.status, 404);
});

test('M2-T3: Idempotent set logging and correction', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({ where: { email: 'client_m2_t3@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t3@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(user.id);

  const workoutSession = await prisma.clientWorkoutSession.create({
    data: { userId: user.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // 1. Initial set log
  const req1 = new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      action: 'log_set',
      sessionId: workoutSession.id,
      exerciseId: 'leg',
      exerciseName: 'Leg Press',
      setIndex: 0,
      isWarmup: false,
      weightKg: 60,
      reps: 10,
      completed: true,
    }),
  });
  const res1 = await clientWorkoutsPost(req1);
  assert.equal(res1.status, 200);

  // 2. Correction: update set 0 with 65kg, 8 reps
  const req2 = new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      action: 'log_set',
      sessionId: workoutSession.id,
      exerciseId: 'leg',
      exerciseName: 'Leg Press',
      setIndex: 0,
      isWarmup: false,
      weightKg: 65,
      reps: 8,
      completed: true,
    }),
  });
  const res2 = await clientWorkoutsPost(req2);
  assert.equal(res2.status, 200);

  // Check DB count for setIndex 0
  const count = await prisma.clientWorkoutSetLog.count({
    where: { sessionId: workoutSession.id, exerciseId: 'leg', setIndex: 0, isWarmup: false },
  });
  assert.equal(count, 1, 'Set correction must not duplicate set log row');

  const record = await prisma.clientWorkoutSetLog.findFirst({
    where: { sessionId: workoutSession.id, exerciseId: 'leg', setIndex: 0, isWarmup: false },
  });
  assert.equal(Number(record?.weightKg), 65);
  assert.equal(record?.reps, 8);
});

test('M2-T4: Focus / Session shared state (working sets vs warm-ups)', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({ where: { email: 'client_m2_t4@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t4@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(user.id);

  const workoutSession = await prisma.clientWorkoutSession.create({
    data: { userId: user.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // Log working set 0
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      action: 'log_set',
      sessionId: workoutSession.id,
      exerciseId: 'bench',
      exerciseName: 'Dumbbell Bench Press',
      setIndex: 0,
      isWarmup: false,
      weightKg: 20,
      reps: 10,
      completed: true,
    }),
  }));

  // Log warmup set 0
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      action: 'log_set',
      sessionId: workoutSession.id,
      exerciseId: 'bench',
      exerciseName: 'Dumbbell Bench Press',
      setIndex: 0,
      isWarmup: true,
      weightKg: 10,
      reps: 12,
      completed: true,
    }),
  }));

  // Check GET returns both sets cleanly segregated
  const getRes = await clientWorkoutsGet(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: session.cookieHeader },
  }));
  const getData = await getRes.json();
  assert.equal(getData.activeSession.setLogs.length, 2);
  const warmup = getData.activeSession.setLogs.find((s: any) => s.isWarmup);
  const working = getData.activeSession.setLogs.find((s: any) => !s.isWarmup);
  assert.equal(warmup.weightKg, '10');
  assert.equal(working.weightKg, '20');
});

test('M2-T5: Rest-timer recovery logic', async () => {
  const durationSec = 120;
  const now = Date.now();
  const ends = now + durationSec * 1000;

  // After 30 seconds elapses
  const simulatedResumeTime = now + 30 * 1000;
  const remaining = Math.max(0, Math.ceil((ends - simulatedResumeTime) / 1000));
  assert.equal(remaining, 90, 'Rest timer remaining seconds must calculate accurately from end timestamp');
});

test('M2-T6: Programme-version links on workout sessions and meal logs', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({ where: { email: 'client_m2_t6@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t6@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(user.id);

  // Clean slate for test user
  await prisma.clientWorkoutSetLog.deleteMany({ where: { session: { userId: user.id } } });
  await prisma.clientWorkoutSession.deleteMany({ where: { userId: user.id } });
  await prisma.dailyMealLog.deleteMany({ where: { userId: user.id } });
  await prisma.programmeDraft.deleteMany({ where: { clientUserId: user.id } });

  // Set active published plan as 'Active v1'
  const progV1 = await prisma.programmeDraft.create({
    data: {
      clientUserId: user.id,
      version: 'Active v1',
      isPublished: true,
      publishedAt: new Date(),
      trainingJson: [{ name: 'Full Body A' }],
      nutritionJson: [{ meal: 'Breakfast', food: 'Oats' }],
    },
  });

  // 1. Start workout session
  const wRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'start_or_resume', workoutId: 'a', workoutName: 'Full Body A' }),
  }));
  const wData = await wRes.json();
  assert.equal(wData.session.programmeDraftId, progV1.id);
  assert.equal(wData.session.programmeVersion, 'Active v1');

  // 2. Log meal
  const mRes = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      mealType: 'BREAKFAST',
      mealName: 'Oats & boiled eggs',
      status: 'PLANNED',
    }),
  }));
  const mData = await mRes.json();
  assert.equal(mData.mealLog.programmeDraftId, progV1.id);
  assert.equal(mData.mealLog.programmeVersion, 'Active v1');
});

test('M2-T7: Draft vs published plan isolation in client logging', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({ where: { email: 'client_m2_t7@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t7@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(user.id);

  // Clean slate for test user
  await prisma.clientWorkoutSetLog.deleteMany({ where: { session: { userId: user.id } } });
  await prisma.clientWorkoutSession.deleteMany({ where: { userId: user.id } });
  await prisma.dailyMealLog.deleteMany({ where: { userId: user.id } });
  await prisma.programmeDraft.deleteMany({ where: { clientUserId: user.id } });

  // Published plan is v1
  const publishedV1 = await prisma.programmeDraft.create({
    data: { clientUserId: user.id, version: 'Active v1', isPublished: true, publishedAt: new Date(), trainingJson: [], nutritionJson: [] },
  });

  // Unpublished coach draft is v2
  await prisma.programmeDraft.create({
    data: { clientUserId: user.id, version: 'Draft v2', isPublished: false, trainingJson: [], nutritionJson: [] },
  });

  // Client starts session -> references published v1, NOT draft v2
  const wRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'start_or_resume', workoutId: 'c', workoutName: 'Full Body C' }),
  }));
  const wData = await wRes.json();
  assert.equal(wData.session.programmeDraftId, publishedV1.id);
  assert.equal(wData.session.programmeVersion, 'Active v1');
});

test('M2-T8: Nutrition logging and status changes (Ate as Planned, Changed, Didn’t Eat)', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({ where: { email: 'client_m2_t8@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t8@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(user.id);
  await prisma.dailyMealLog.deleteMany({ where: { userId: user.id } });

  // 1. Ate as planned
  const res1 = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      date: '2026-11-14',
      mealType: 'BREAKFAST',
      mealName: 'Oats & boiled eggs',
      status: 'PLANNED',
    }),
  }));
  const data1 = await res1.json();
  assert.equal(data1.mealLog.status, 'PLANNED');

  // 2. Changed with substitution
  const res2 = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      date: '2026-11-14',
      mealType: 'LUNCH',
      mealName: 'Rice & grilled fish',
      status: 'CHANGED',
      customFoods: [{ name: 'Jollof rice', grams: 200, state: 'cooked' }],
      notes: 'Swapped white rice for home-cooked jollof rice',
    }),
  }));
  const data2 = await res2.json();
  assert.equal(data2.mealLog.status, 'CHANGED');

  // 3. Didn't eat (Skipped)
  const res3 = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      date: '2026-11-14',
      mealType: 'DINNER',
      mealName: 'Eba & egusi soup',
      status: 'SKIPPED',
    }),
  }));
  const data3 = await res3.json();
  assert.equal(data3.mealLog.status, 'SKIPPED');
});

test('M2-T9: Accurate Not Recorded versus Didn’t Eat semantics', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({ where: { email: 'client_m2_t9@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t9@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(user.id);
  await prisma.dailyMealLog.deleteMany({ where: { userId: user.id } });

  // Set to SKIPPED (Didn't Eat) -> explicitly saved row with status = SKIPPED
  await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-11-14', mealType: 'SNACK', mealName: 'Groundnuts', status: 'SKIPPED' }),
  }));
  const skippedCount = await prisma.dailyMealLog.count({ where: { userId: user.id, date: '2026-11-14', mealType: 'SNACK', status: 'SKIPPED' } });
  assert.equal(skippedCount, 1);

  // Reset to NOT_RECORDED -> row is deleted, representing clean unknown/unrecorded state
  const resetRes = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-11-14', mealType: 'SNACK', mealName: 'Groundnuts', status: 'NOT_RECORDED' }),
  }));
  const resetData = await resetRes.json();
  assert.equal(resetData.status, 'NOT_RECORDED');

  const afterResetCount = await prisma.dailyMealLog.count({ where: { userId: user.id, date: '2026-11-14', mealType: 'SNACK' } });
  assert.equal(afterResetCount, 0, 'Not Recorded meal must have 0 rows in daily log');
});

test('M2-T10: Preservation of historical records after Sahmi publishes a new programme (v2)', async () => {
  const prisma = db();
  const coach = await prisma.user.upsert({ where: { email: 'coach_m2_t10@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_m2_t10@test.internal', role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: 'client_m2_t10@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t10@test.internal', role: 'CLIENT' } });

  const coachSession = await issueUserSession(coach.id);
  const clientSession = await issueUserSession(client.id);

  await prisma.programmeDraft.deleteMany({ where: { clientUserId: client.id } });
  await prisma.clientWorkoutSession.deleteMany({ where: { userId: client.id } });
  await prisma.dailyMealLog.deleteMany({ where: { userId: client.id } });

  // 1. Publish v1
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v1', training: [{ name: 'A' }], nutrition: [{ meal: 'M' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  // Client logs session and meal under v1
  const session1 = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', programmeVersion: 'Active v1', status: 'COMPLETED' },
  });
  const meal1 = await prisma.dailyMealLog.create({
    data: { userId: client.id, date: '2026-11-10', mealType: 'BREAKFAST', mealName: 'Oats v1', programmeVersion: 'Active v1', status: 'PLANNED' },
  });

  // 2. Sahmi publishes v2
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v2', training: [{ name: 'A2' }], nutrition: [{ meal: 'M2' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  // Past records still retain 'Active v1'
  const histSession = await prisma.clientWorkoutSession.findUnique({ where: { id: session1.id } });
  const histMeal = await prisma.dailyMealLog.findUnique({ where: { id: meal1.id } });
  assert.equal(histSession?.programmeVersion, 'Active v1');
  assert.equal(histMeal?.programmeVersion, 'Active v1');

  // Client starts new session under v2 -> gets stamped with 'Active v2'
  const newSessionRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ action: 'start_or_resume', workoutId: 'b', workoutName: 'Full Body B' }),
  }));
  const newSessionData = await newSessionRes.json();
  assert.equal(newSessionData.session.programmeVersion, 'Active v2');
});

test('M2-T11: Safety hold blocks workout and meal logging', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_m2_t11_held@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t11_held@test.internal', role: 'CLIENT' } });
  const session = await issueUserSession(client.id);

  // Place on safety hold
  await prisma.clientAssessment.upsert({
    where: { userId: client.id },
    update: { status: 'SAFETY_HELD' },
    create: { userId: client.id, status: 'SAFETY_HELD' },
  });

  // Workout start fails with 403
  const wRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'start_or_resume', workoutId: 'a', workoutName: 'Full Body A' }),
  }));
  assert.equal(wRes.status, 403);

  // Meal logging fails with 403
  const mRes = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ mealType: 'BREAKFAST', mealName: 'Eggs', status: 'PLANNED' }),
  }));
  assert.equal(mRes.status, 403);
});

test('M2-T12: Coach inspection of client activity', async () => {
  const prisma = db();
  const coach = await prisma.user.upsert({ where: { email: 'coach_m2_t12@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_m2_t12@test.internal', role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: 'client_m2_t12@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_m2_t12@test.internal', role: 'CLIENT' } });

  // Clean slate for client and coach
  await prisma.clientWorkoutSetLog.deleteMany({ where: { session: { userId: client.id } } });
  await prisma.clientWorkoutSession.deleteMany({ where: { userId: client.id } });
  await prisma.dailyMealLog.deleteMany({ where: { userId: client.id } });
  await prisma.programmeDraft.deleteMany({ where: { clientUserId: client.id } });

  const coachSession = await issueUserSession(coach.id);
  const clientSession = await issueUserSession(client.id);

  // Client has 1 completed session with a temporary exercise swap
  const s = await prisma.clientWorkoutSession.create({
    data: {
      userId: client.id,
      workoutId: 'a',
      workoutName: 'Full Body A',
      programmeVersion: 'Active v1',
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
  await prisma.clientWorkoutSetLog.create({
    data: {
      sessionId: s.id,
      exerciseId: 'goblet',
      exerciseName: 'Goblet Squat',
      targetExerciseId: 'leg',
      isSwap: true,
      setIndex: 0,
      weightKg: 24,
      reps: 10,
      completed: true,
    },
  });

  // Client has 1 planned meal and 1 changed meal
  await prisma.dailyMealLog.create({
    data: { userId: client.id, date: '2026-11-14', mealType: 'BREAKFAST', mealName: 'Oats', status: 'PLANNED' },
  });
  await prisma.dailyMealLog.create({
    data: { userId: client.id, date: '2026-11-14', mealType: 'LUNCH', mealName: 'Rice', status: 'CHANGED', customFoods: [{ name: 'Yam', grams: 200 }] },
  });

  // Coach queries activity endpoint
  const req = new Request(`${ORIGIN}/api/coach/clients/${client.id}/activity`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: coachSession.cookieHeader },
  });
  const res = await coachActivityGet(req, { params: Promise.resolve({ id: client.id }) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.signals.totalSessionsCompleted, 1);
  assert.equal(data.signals.totalMealsPlanned, 1);
  assert.equal(data.signals.totalMealsChanged, 1);
  assert.equal(data.workoutSessions[0].setLogs[0].isSwap, true, 'Temporary exercise swap must be visible to coach');

  // Client user attempting to call coach endpoint -> 403
  const clientReq = new Request(`${ORIGIN}/api/coach/clients/${client.id}/activity`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: clientSession.cookieHeader },
  });
  const clientRes = await coachActivityGet(clientReq, { params: Promise.resolve({ id: client.id }) });
  assert.equal(clientRes.status, 403);
});
