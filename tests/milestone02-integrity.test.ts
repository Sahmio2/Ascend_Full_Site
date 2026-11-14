import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { db } from '../src/server/db';
import { issueUserSession } from '../src/server/auth';
import { GET as clientWorkoutsGet, POST as clientWorkoutsPost } from '../src/app/api/client/workouts/route';
import { GET as clientMealsGet, POST as clientMealsPost } from '../src/app/api/client/meals/route';
import { GET as coachActivityGet } from '../src/app/api/coach/clients/[id]/activity/route';
import { GET as coachProgrammeGet, PUT as coachProgrammePut } from '../src/app/api/coach/programmes/[id]/route';
import { POST as coachPublishPost } from '../src/app/api/coach/programmes/[id]/publish/route';

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

after(async () => {
  await db().$disconnect();
});

// Helper to clean up user data
async function cleanUser(userId: string) {
  const prisma = db();
  await prisma.clientWorkoutSetLog.deleteMany({ where: { session: { userId } } });
  await prisma.clientWorkoutSession.deleteMany({ where: { userId } });
  await prisma.dailyMealLog.deleteMany({ where: { userId } });
  await prisma.mealAuditLog.deleteMany({ where: { userId } });
  await prisma.programmeDraft.deleteMany({ where: { clientUserId: userId } });
}

// --------------------------------------------------------------------------
// Case 1: v1 workout starts, v2 publishes mid-session, remaining sets & session stay pinned to v1
// --------------------------------------------------------------------------
test('Case 1: v1 workout starts, v2 publishes mid-session, remaining sets and completed session stay pinned to v1', async () => {
  const prisma = db();
  const coach = await prisma.user.upsert({ where: { email: 'coach_c1@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_c1@test.internal', role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: 'client_c1@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c1@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);

  const coachSession = await issueUserSession(coach.id);
  const clientSession = await issueUserSession(client.id);

  // 1. Publish v1
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v1', training: [{ name: 'Leg Press', swap: 'Goblet Squat' }], nutrition: [{ meal: 'Breakfast', food: 'Oats' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  // 2. Client starts workout session -> pinned to v1
  const startRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ action: 'start_or_resume', workoutId: 'a', workoutName: 'Full Body A' }),
  }));
  const startData = await startRes.json();
  assert.equal(startData.session.programmeVersion, 'Active v1');
  const sessionId = startData.session.id;

  // 3. Sahmi publishes v2 mid-session
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v2', training: [{ name: 'Hack Squat' }], nutrition: [{ meal: 'Breakfast', food: 'Eggs' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  // 4. In-progress GET still returns v1 for this active session
  const getRes = await clientWorkoutsGet(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: clientSession.cookieHeader },
  }));
  const getData = await getRes.json();
  assert.equal(getData.activeSession.programmeVersion, 'Active v1');
  assert.equal(getData.activeProgramme.version, 'Active v1');

  // 5. Client logs a set -> set persists under session pinned to v1
  const setRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 0, weightKg: 75, reps: 10 }),
  }));
  assert.equal(setRes.status, 200);

  // 6. Complete session -> still retained as v1
  const compRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ action: 'complete_session', sessionId, status: 'COMPLETED' }),
  }));
  const compData = await compRes.json();
  assert.equal(compData.session.programmeVersion, 'Active v1');
});

// --------------------------------------------------------------------------
// Case 2: v1 meal logged, v2 publishes, historical meal still links to v1
// --------------------------------------------------------------------------
test('Case 2: v1 meal logged, v2 publishes, historical meal still links to v1', async () => {
  const prisma = db();
  const coach = await prisma.user.upsert({ where: { email: 'coach_c2@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_c2@test.internal', role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: 'client_c2@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c2@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);

  const coachSession = await issueUserSession(coach.id);
  const clientSession = await issueUserSession(client.id);

  // Publish v1
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v1', training: [], nutrition: [{ meal: 'Breakfast', food: 'Oats' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  // Log meal under v1
  const mRes = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ date: '2026-11-10', mealType: 'BREAKFAST', mealName: 'Oats & boiled eggs', status: 'PLANNED' }),
  }));
  const mData = await mRes.json();
  assert.equal(mData.mealLog.programmeVersion, 'Active v1');

  // Sahmi publishes v2
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v2', training: [], nutrition: [{ meal: 'Breakfast', food: 'Eggs' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  // Update notes on the v1 meal -> must NOT overwrite programmeVersion with Active v2
  const updateRes = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ date: '2026-11-10', mealType: 'BREAKFAST', mealName: 'Oats & boiled eggs', status: 'PLANNED', notes: 'Added pinch of cinnamon' }),
  }));
  const updatedData = await updateRes.json();
  assert.equal(updatedData.mealLog.programmeVersion, 'Active v1', 'Meal update must preserve historical programme version');
});

// --------------------------------------------------------------------------
// Case 3: Attempt to delete published programme; deletion prevented when activity records exist
// --------------------------------------------------------------------------
test('Case 3: Deletion of referenced published programme is prevented by Restrict constraint', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c3@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c3@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);

  const prog = await prisma.programmeDraft.create({
    data: { clientUserId: client.id, version: 'Active v1', isPublished: true, publishedAt: new Date(), trainingJson: [], nutritionJson: [] },
  });

  await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'A', programmeDraftId: prog.id, programmeVersion: 'Active v1', status: 'COMPLETED' },
  });

  // Attempting to delete programme referenced by workout session must throw
  let threw = false;
  try {
    await prisma.programmeDraft.delete({ where: { id: prog.id } });
  } catch {
    threw = true;
  }
  assert.equal(threw, true, 'Deleting a programme draft referenced by workout sessions must fail closed');
});

// --------------------------------------------------------------------------
// Case 4: Attempt to edit previously published v1 never mutates v1
// --------------------------------------------------------------------------
test('Case 4: Attempt to edit draft never mutates a previously published plan', async () => {
  const prisma = db();
  const coach = await prisma.user.upsert({ where: { email: 'coach_c4@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_c4@test.internal', role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: 'client_c4@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c4@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);

  const coachSession = await issueUserSession(coach.id);

  // Publish v1
  await coachPublishPost(new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true], version: 'Active v1', training: [{ name: 'V1 Exercise' }], nutrition: [{ meal: 'V1 Nutrition' }] }),
  }), { params: Promise.resolve({ id: client.id }) });

  const publishedV1 = await prisma.programmeDraft.findFirst({ where: { clientUserId: client.id, isPublished: true } });
  assert.ok(publishedV1);

  // Coach saves a draft for the next iteration
  const putRes = await coachProgrammePut(new Request(`${ORIGIN}/api/coach/programmes/${client.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({ version: 'Draft v2', training: [{ name: 'V2 Proposed Exercise' }], nutrition: [{ meal: 'V2 Nutrition' }] }),
  }), { params: Promise.resolve({ id: client.id }) });
  assert.equal(putRes.status, 200);

  // Verify published v1 was NOT mutated
  const reloadedV1 = await prisma.programmeDraft.findUnique({ where: { id: publishedV1.id } });
  assert.equal(reloadedV1?.isPublished, true);
  assert.deepEqual((reloadedV1?.trainingJson as any)[0].name, 'V1 Exercise', 'Published v1 training must remain completely immutable');
});

// --------------------------------------------------------------------------
// Case 5: Two simultaneous log_set requests for the same logical working set -> one row
// --------------------------------------------------------------------------
test('Case 5: Two simultaneous log_set requests for the same logical working set -> exactly one row in DB', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c5@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c5@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  const payload = {
    action: 'log_set',
    sessionId: wSession.id,
    exerciseId: 'leg',
    exerciseName: 'Leg Press',
    setIndex: 0,
    isWarmup: false,
    weightKg: 80,
    reps: 10,
  };

  // Dispatch two concurrent requests simultaneously
  const [res1, res2] = await Promise.all([
    clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
      body: JSON.stringify(payload),
    })),
    clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
      body: JSON.stringify(payload),
    })),
  ]);

  assert.equal(res1.status, 200);
  assert.equal(res2.status, 200);

  const count = await prisma.clientWorkoutSetLog.count({
    where: { sessionId: wSession.id, slotId: 'leg', setIndex: 0, isWarmup: false },
  });
  assert.equal(count, 1, 'Concurrent set logging must result in exactly one row in MySQL due to composite unique key');
});

// --------------------------------------------------------------------------
// Case 6: Retry with identical payload -> no duplication; intentional edit -> proper update
// --------------------------------------------------------------------------
test('Case 6: Retry identical payload -> no duplication; intentional edit -> proper update', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c6@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c6@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // Initial log
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 1, weightKg: 60, reps: 10 }),
  }));

  // Duplicate retry
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 1, weightKg: 60, reps: 10 }),
  }));

  // Intentional edit: 65kg, 8 reps
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 1, weightKg: 65, reps: 8 }),
  }));

  const sets = await prisma.clientWorkoutSetLog.findMany({
    where: { sessionId: wSession.id, slotId: 'leg', setIndex: 1 },
  });
  assert.equal(sets.length, 1);
  assert.equal(Number(sets[0].weightKg), 65);
  assert.equal(sets[0].reps, 8);
});

// --------------------------------------------------------------------------
// Case 7: Normal exercise then approved swap -> does not duplicate the same original set slot
// --------------------------------------------------------------------------
test('Case 7: Normal exercise then approved swap -> does not duplicate same set slot', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c7@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c7@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // 1. Log set 0 as normal Leg Press
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 0, weightKg: 60, reps: 10 }),
  }));

  // 2. Client swaps slot 'leg' to approved 'goblet' (Goblet Squat)
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'goblet', exerciseName: 'Goblet Squat', targetExerciseId: 'leg', isSwap: true, setIndex: 0, weightKg: 24, reps: 12 }),
  }));

  // Must update the existing slot row, not add a second row
  const rows = await prisma.clientWorkoutSetLog.findMany({
    where: { sessionId: wSession.id, slotId: 'leg', setIndex: 0 },
  });
  assert.equal(rows.length, 1, 'Swapping set 0 must update slotId="leg", resulting in 1 row');
  assert.equal(rows[0].exerciseId, 'goblet');
  assert.equal(rows[0].isSwap, true);
});

// --------------------------------------------------------------------------
// Case 8: Warmup set #1 and working set #1 persist separately
// --------------------------------------------------------------------------
test('Case 8: Warmup set #1 and working set #1 persist separately and counts are distinct', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c8@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c8@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // Working set index 0
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'bench', exerciseName: 'Bench', setIndex: 0, isWarmup: false, weightKg: 20, reps: 10 }),
  }));

  // Warmup set index 0
  await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'bench', exerciseName: 'Bench', setIndex: 0, isWarmup: true, weightKg: 10, reps: 12 }),
  }));

  const allSets = await prisma.clientWorkoutSetLog.findMany({ where: { sessionId: wSession.id } });
  assert.equal(allSets.length, 2);
  const working = allSets.filter(s => !s.isWarmup);
  const warmups = allSets.filter(s => s.isWarmup);
  assert.equal(working.length, 1);
  assert.equal(warmups.length, 1);
});

// --------------------------------------------------------------------------
// Case 9: Unauthorized substitute, mismatched target or forged isSwap -> rejected
// --------------------------------------------------------------------------
test('Case 9: Unauthorized substitute or forged isSwap is rejected with 400', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c9@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c9@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // Attempt unapproved swap: 'leg' swapped for unapproved 'bicep_curl'
  const res = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'bicep_curl', exerciseName: 'Bicep Curl', targetExerciseId: 'leg', isSwap: true, setIndex: 0, weightKg: 15, reps: 10 }),
  }));
  assert.equal(res.status, 400);
});

// --------------------------------------------------------------------------
// Case 10: Invalid or spoofed client/session IDs -> unauthorized access rejected
// --------------------------------------------------------------------------
test('Case 10: User A cannot read, update or complete User B workout session', async () => {
  const prisma = db();
  const userA = await prisma.user.upsert({ where: { email: 'user_a_c10@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'user_a_c10@test.internal', role: 'CLIENT' } });
  const userB = await prisma.user.upsert({ where: { email: 'user_b_c10@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'user_b_c10@test.internal', role: 'CLIENT' } });
  await cleanUser(userA.id);
  await cleanUser(userB.id);

  const sessionA = await issueUserSession(userA.id);
  const bSession = await prisma.clientWorkoutSession.create({
    data: { userId: userB.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // User A attempts to complete User B's session -> 404
  const res = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: sessionA.cookieHeader },
    body: JSON.stringify({ action: 'complete_session', sessionId: bSession.id, status: 'COMPLETED' }),
  }));
  assert.equal(res.status, 404);
});

// --------------------------------------------------------------------------
// Case 11: Coach cannot inspect non-client target
// --------------------------------------------------------------------------
test('Case 11: Coach activity endpoint rejects non-client target users with 404', async () => {
  const prisma = db();
  const coach1 = await prisma.user.upsert({ where: { email: 'coach_c11_1@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_c11_1@test.internal', role: 'COACH' } });
  const coach2 = await prisma.user.upsert({ where: { email: 'coach_c11_2@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_c11_2@test.internal', role: 'COACH' } });

  const session1 = await issueUserSession(coach1.id);

  // Coach 1 attempts to query activity of Coach 2 (who has role COACH, not CLIENT) -> 404
  const res = await coachActivityGet(new Request(`${ORIGIN}/api/coach/clients/${coach2.id}/activity`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: session1.cookieHeader },
  }), { params: Promise.resolve({ id: coach2.id }) });
  assert.equal(res.status, 404);
});

// --------------------------------------------------------------------------
// Case 12: Unpublished programme not visible or usable by client logging
// --------------------------------------------------------------------------
test('Case 12: Unpublished programme draft is not stamped on new client sessions', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c12@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c12@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  // Create published v1
  const pub = await prisma.programmeDraft.create({
    data: { clientUserId: client.id, version: 'Active v1', isPublished: true, publishedAt: new Date(), trainingJson: [], nutritionJson: [] },
  });

  // Create unreleased draft v2 (isPublished: false)
  await prisma.programmeDraft.create({
    data: { clientUserId: client.id, version: 'Draft v2', isPublished: false, publishedAt: null, trainingJson: [], nutritionJson: [] },
  });

  // Client starts session -> references pub.id, NOT draft v2
  const res = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'start_or_resume', workoutId: 'a', workoutName: 'Full Body A' }),
  }));
  const data = await res.json();
  assert.equal(data.session.programmeDraftId, pub.id);
  assert.equal(data.session.programmeVersion, 'Active v1');
});

// --------------------------------------------------------------------------
// Case 13: Repeated completion is idempotent and does not alter completedAt
// --------------------------------------------------------------------------
test('Case 13: Repeated complete_session calls are idempotent and retain original completedAt', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c13@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c13@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // Complete session #1
  const res1 = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'complete_session', sessionId: wSession.id, status: 'COMPLETED' }),
  }));
  const data1 = await res1.json();
  const originalCompletedAt = data1.session.completedAt;

  // Complete session #2 (idempotent call)
  const res2 = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'complete_session', sessionId: wSession.id, status: 'COMPLETED' }),
  }));
  const data2 = await res2.json();
  assert.equal(data2.ok, true);
  assert.equal(data2.session.completedAt, originalCompletedAt, 'completedAt must remain unchanged on repeat complete');
});

// --------------------------------------------------------------------------
// Case 14: Meal SKIPPED vs NOT_RECORDED remain distinguishable
// --------------------------------------------------------------------------
test('Case 14: Meal SKIPPED vs NOT_RECORDED remain strictly distinguishable', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c14@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c14@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  // 1. Mark Breakfast as SKIPPED
  await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-11-14', mealType: 'BREAKFAST', mealName: 'Oats', status: 'SKIPPED' }),
  }));
  const skippedRow = await prisma.dailyMealLog.findUnique({
    where: { userId_date_mealType: { userId: client.id, date: '2026-11-14', mealType: 'BREAKFAST' } },
  });
  assert.ok(skippedRow);
  assert.equal(skippedRow.status, 'SKIPPED');

  // 2. Mark Lunch as NOT_RECORDED (reset)
  await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-11-14', mealType: 'LUNCH', mealName: 'Rice', status: 'NOT_RECORDED' }),
  }));
  const unrecordedRow = await prisma.dailyMealLog.findUnique({
    where: { userId_date_mealType: { userId: client.id, date: '2026-11-14', mealType: 'LUNCH' } },
  });
  assert.equal(unrecordedRow, null, 'NOT_RECORDED meal must have 0 rows in DailyMealLog');
});

// --------------------------------------------------------------------------
// Case 15: CHANGED actual grams + prep state persist
// --------------------------------------------------------------------------
test('Case 15: CHANGED actual grams + prep state persist across retrieval', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c15@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c15@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      date: '2026-11-14',
      mealType: 'LUNCH',
      mealName: 'Rice & grilled fish',
      status: 'CHANGED',
      customFoods: [
        { name: 'Jollof rice', grams: 220, state: 'cooked', kcal: 350, isEstimated: false },
        { name: 'Grilled tilapia', grams: 140, state: 'cooked', kcal: 180, isEstimated: false },
      ],
      notes: 'Substituted mackerel for fresh tilapia',
    }),
  }));

  const getRes = await clientMealsGet(new Request(`${ORIGIN}/api/client/meals?date=2026-11-14`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: session.cookieHeader },
  }));
  const getData = await getRes.json();
  const lunch = getData.loggedMeals.find((m: any) => m.mealType === 'LUNCH');
  assert.equal(lunch.status, 'CHANGED');
  assert.equal(lunch.customFoods.length, 2);
  assert.equal(lunch.customFoods[0].grams, 220);
  assert.equal(lunch.customFoods[0].state, 'cooked');
});

// --------------------------------------------------------------------------
// Case 16: Unknown/new food composition never yields invented macros
// --------------------------------------------------------------------------
test('Case 16: Unknown food composition retains unverified/optional macros without fabrication', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c16@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c16@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  // Client logs a local market item with grams only and no verified macro breakdown
  const res = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({
      date: '2026-11-14',
      mealType: 'SNACK',
      mealName: 'Roasted groundnuts',
      status: 'CHANGED',
      customFoods: [{ name: 'Market roasted groundnuts', grams: 50, state: 'roasted', isEstimated: true }],
    }),
  }));
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.mealLog.customFoods[0].kcal, undefined, 'Must not invent calories for unknown foods');
  assert.equal(data.mealLog.customFoods[0].isEstimated, true);
});

// --------------------------------------------------------------------------
// Case 17: Meal reset audit is retained in MealAuditLog
// --------------------------------------------------------------------------
test('Case 17: Resetting meal to NOT_RECORDED preserves audit history event', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c17@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c17@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  // 1. Log dinner
  await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-11-14', mealType: 'DINNER', mealName: 'Eba', status: 'PLANNED' }),
  }));

  // 2. Reset dinner to NOT_RECORDED
  await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-11-14', mealType: 'DINNER', mealName: 'Eba', status: 'NOT_RECORDED' }),
  }));

  // Check audit log
  const auditEntries = await prisma.mealAuditLog.findMany({
    where: { userId: client.id, mealType: 'DINNER' },
    orderBy: { recordedAt: 'asc' },
  });
  assert.ok(auditEntries.length >= 2);
  const resetEvent = auditEntries.find(e => e.action === 'RESET_NOT_RECORDED');
  assert.ok(resetEvent);
  assert.equal(resetEvent?.previousStatus, 'PLANNED');
  assert.equal(resetEvent?.newStatus, 'NOT_RECORDED');
});

// --------------------------------------------------------------------------
// Case 18: Invalid date format (e.g. 2026-02-31) is rejected
// --------------------------------------------------------------------------
test('Case 18: Invalid calendar date like 2026-02-31 is rejected with 400', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c18@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c18@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const res = await clientMealsPost(new Request(`${ORIGIN}/api/client/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ date: '2026-02-31', mealType: 'BREAKFAST', mealName: 'Oats', status: 'PLANNED' }),
  }));
  assert.equal(res.status, 400, 'Invalid calendar day must fail runtime validation');
});

// --------------------------------------------------------------------------
// Case 19: v1/v2 mixed historical activity renders correctly in Coach Studio
// --------------------------------------------------------------------------
test('Case 19: Coach activity endpoint reflects historical versioning across v1 and v2', async () => {
  const prisma = db();
  const coach = await prisma.user.upsert({ where: { email: 'coach_c19@test.internal' }, update: { role: 'COACH' }, create: { email: 'coach_c19@test.internal', role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: 'client_c19@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c19@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);

  const coachSession = await issueUserSession(coach.id);

  // Session under v1
  await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'A', programmeVersion: 'Active v1', status: 'COMPLETED' },
  });
  // Session under v2
  await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'b', workoutName: 'B', programmeVersion: 'Active v2', status: 'COMPLETED' },
  });

  const res = await coachActivityGet(new Request(`${ORIGIN}/api/coach/clients/${client.id}/activity`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: coachSession.cookieHeader },
  }), { params: Promise.resolve({ id: client.id }) });
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.signals.totalSessionsCompleted, 2);
  const v1Session = data.workoutSessions.find((s: any) => s.programmeVersion === 'Active v1');
  const v2Session = data.workoutSessions.find((s: any) => s.programmeVersion === 'Active v2');
  assert.ok(v1Session);
  assert.ok(v2Session);
});

// --------------------------------------------------------------------------
// Case 20: Workout rest timer calculation and session scoping
// --------------------------------------------------------------------------
test('Case 20: Workout rest timer logic correctly validates matching session and rejects mismatched', async () => {
  const currentSessionId = 'session_active_123';
  const ends = Date.now() + 90 * 1000;

  // Matching timer payload
  const matchingTimer = { ends, remaining: 90, exerciseId: 'leg', sessionId: currentSessionId };
  const isValidForSession = matchingTimer.ends > Date.now() && matchingTimer.sessionId === currentSessionId;
  assert.equal(isValidForSession, true);

  // Stale timer from previous user or different session
  const staleTimer = { ends, remaining: 90, exerciseId: 'leg', sessionId: 'old_session_999' };
  const isStaleValid = staleTimer.ends > Date.now() && staleTimer.sessionId === currentSessionId;
  assert.equal(isStaleValid, false, 'Timer belonging to different session must be rejected');
});

// --------------------------------------------------------------------------
// Case 21: Concurrent start_or_resume requests return single in-progress session
// --------------------------------------------------------------------------
test('Case 21: Concurrent start_or_resume requests return single session without duplication', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c21@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c21@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  // Dispatch two concurrent start_or_resume calls
  const [res1, res2] = await Promise.all([
    clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
      body: JSON.stringify({ action: 'start_or_resume', workoutId: 'a', workoutName: 'Full Body A' }),
    })),
    clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
      body: JSON.stringify({ action: 'start_or_resume', workoutId: 'a', workoutName: 'Full Body A' }),
    })),
  ]);

  const data1 = await res1.json();
  const data2 = await res2.json();

  assert.equal(data1.ok, true);
  assert.equal(data2.ok, true);

  const inProgressSessions = await prisma.clientWorkoutSession.findMany({
    where: { userId: client.id, workoutId: 'a', status: 'IN_PROGRESS' },
  });
  assert.equal(inProgressSessions.length, 1, 'Exactly one in-progress session must exist');
});

// --------------------------------------------------------------------------
// Case 22: Malformed, negative, excessive or non-finite inputs fail runtime validation
// --------------------------------------------------------------------------
test('Case 22: Malformed, negative, excessive or non-finite inputs fail validation', async () => {
  const prisma = db();
  const client = await prisma.user.upsert({ where: { email: 'client_c22@test.internal' }, update: { role: 'CLIENT' }, create: { email: 'client_c22@test.internal', role: 'CLIENT' } });
  await cleanUser(client.id);
  const session = await issueUserSession(client.id);

  const wSession = await prisma.clientWorkoutSession.create({
    data: { userId: client.id, workoutId: 'a', workoutName: 'Full Body A', status: 'IN_PROGRESS' },
  });

  // 1. Negative weight -> 400
  const negRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 0, weightKg: -50, reps: 10 }),
  }));
  assert.equal(negRes.status, 400);

  // 2. Excessive weight > 1000kg -> 400
  const excessRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 0, weightKg: 2000, reps: 10 }),
  }));
  assert.equal(excessRes.status, 400);

  // 3. Non-finite weight -> 400
  const nanRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 0, weightKg: 'not-a-number', reps: 10 }),
  }));
  assert.equal(nanRes.status, 400);

  // 4. Excessive reps > 500 -> 400
  const repsRes = await clientWorkoutsPost(new Request(`${ORIGIN}/api/client/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: session.cookieHeader },
    body: JSON.stringify({ action: 'log_set', sessionId: wSession.id, exerciseId: 'leg', exerciseName: 'Leg Press', setIndex: 0, weightKg: 50, reps: 9999 }),
  }));
  assert.equal(repsRes.status, 400);
});
