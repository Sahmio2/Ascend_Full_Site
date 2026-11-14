import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { db } from '../src/server/db';
import { issueUserSession } from '../src/server/auth';
import { POST as assessmentPost, GET as assessmentGet } from '../src/app/api/assessment/route';
import { GET as coachClientsGet } from '../src/app/api/coach/clients/route';
import { GET as coachAssessmentGet } from '../src/app/api/coach/assessments/[id]/route';
import { GET as coachProgrammeGet, PUT as coachProgrammePut } from '../src/app/api/coach/programmes/[id]/route';
import { POST as coachProgrammePublishPost } from '../src/app/api/coach/programmes/[id]/publish/route';
import { GET as clientProgrammeGet } from '../src/app/api/client/programme/route';
import { GET as accountSnapshotGet } from '../src/app/api/account/snapshot/route';

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

after(async () => {
  await db().$disconnect();
});

test('Slice 01 - T1: Client submits same assessment twice: idempotent submission & single queue delivery date', async () => {
  const prisma = db();
  const email = 'client_t1_idempotent@test.internal';

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'CLIENT' },
    create: { email, role: 'CLIENT' },
  });

  // Clean prior assessment
  await prisma.assessmentStageData.deleteMany({ where: { assessment: { userId: user.id } } });
  await prisma.clientAssessment.deleteMany({ where: { userId: user.id } });

  const session = await issueUserSession(user.id);
  const cookieHeader = session.cookieHeader;

  const answers = {
    'FT-02': '28',
    'BS-02': 'No',
    'BS-04': 'No',
    'TC-01': '6 to 24 months',
    'GB-01': ['Monday', 'Wednesday', 'Friday'],
  };

  // First submission
  const req1 = new Request(`${ORIGIN}/api/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieHeader },
    body: JSON.stringify({ answers, isSubmitted: true }),
  });
  const res1 = await assessmentPost(req1);
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.ok, true);
  assert.equal(data1.assessment.status, 'SUBMITTED');
  const firstDue = data1.assessment.deliveryDueAt;

  const record1 = await prisma.clientAssessment.findUnique({ where: { userId: user.id } });
  assert.ok(record1);
  assert.ok(record1.submittedAt);

  // Second submission (retry)
  const req2 = new Request(`${ORIGIN}/api/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieHeader },
    body: JSON.stringify({ answers, isSubmitted: true }),
  });
  const res2 = await assessmentPost(req2);
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.ok, true);
  assert.equal(data2.assessment.deliveryDueAt, firstDue, 'Delivery due date must remain identical on retries');

  const record2 = await prisma.clientAssessment.findUnique({ where: { userId: user.id } });
  assert.equal(record2!.submittedAt!.getTime(), record1!.submittedAt!.getTime(), 'Original submission timestamp must be preserved');
});

test('Slice 01 - T2: Unauthenticated or wrong-role user cannot view or mutate coach records', async () => {
  const prisma = db();
  const clientEmail = 'client_t2_noncoach@test.internal';

  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { role: 'CLIENT' },
    create: { email: clientEmail, role: 'CLIENT' },
  });

  const clientSession = await issueUserSession(clientUser.id);

  // 1. Unauthenticated request -> 401
  const unauthReq = new Request(`${ORIGIN}/api/coach/clients`, {
    method: 'GET',
    headers: { Origin: ORIGIN },
  });
  const unauthRes = await coachClientsGet(unauthReq);
  assert.equal(unauthRes.status, 401, 'Unauthenticated coach endpoint call must return 401');

  // 2. Client role user calling coach endpoint -> 403
  const clientReq = new Request(`${ORIGIN}/api/coach/clients`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: clientSession.cookieHeader },
  });
  const clientRes = await coachClientsGet(clientReq);
  assert.equal(clientRes.status, 403, 'Client role calling coach endpoint must return 403');

  // 3. Client role trying to publish programme -> 403
  const clientPubReq = new Request(`${ORIGIN}/api/coach/programmes/${clientUser.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: clientSession.cookieHeader },
    body: JSON.stringify({ checksConfirmed: [true, true, true] }),
  });
  const clientPubRes = await coachProgrammePublishPost(clientPubReq, { params: Promise.resolve({ id: clientUser.id }) });
  assert.equal(clientPubRes.status, 403, 'Client role trying to publish must return 403');
});

test('Slice 01 - T3: Wrong client ID cannot read another clients assessment or active programme', async () => {
  const prisma = db();
  const emailA = 'client_t3_a@test.internal';
  const emailB = 'client_t3_b@test.internal';

  const userA = await prisma.user.upsert({ where: { email: emailA }, update: { role: 'CLIENT' }, create: { email: emailA, role: 'CLIENT' } });
  const userB = await prisma.user.upsert({ where: { email: emailB }, update: { role: 'CLIENT' }, create: { email: emailB, role: 'CLIENT' } });

  const sessionA = await issueUserSession(userA.id);
  const sessionB = await issueUserSession(userB.id);

  // Create active programme for user B
  await prisma.programmeDraft.deleteMany({ where: { clientUserId: userB.id } });
  await prisma.programmeDraft.create({
    data: {
      clientUserId: userB.id,
      version: 'Active v1',
      isPublished: true,
      publishedAt: new Date(),
      trainingJson: [{ name: 'Private Lift for B' }],
      nutritionJson: [{ food: 'Private Nutrition for B' }],
    },
  });

  // User A calls client programme API -> receives only User A's data (no plan), never User B's plan
  const reqA = new Request(`${ORIGIN}/api/client/programme`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: sessionA.cookieHeader },
  });
  const resA = await clientProgrammeGet(reqA);
  assert.equal(resA.status, 200);
  const dataA = await resA.json();
  assert.equal(dataA.status, 'NO_PLAN');
  assert.equal(dataA.programme, null, 'User A must not receive User B programme data');
});

test('Slice 01 - T4: Incomplete / unpaid / blocked client cannot see active coaching', async () => {
  const prisma = db();
  const email = 'client_t4_unpaid@test.internal';

  const user = await prisma.user.upsert({ where: { email }, update: { role: 'CLIENT' }, create: { email, role: 'CLIENT' } });
  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.clientAssessment.deleteMany({ where: { userId: user.id } });

  const session = await issueUserSession(user.id);

  const req = new Request(`${ORIGIN}/api/account/snapshot`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: session.cookieHeader },
  });
  const res = await accountSnapshotGet(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.snapshot.clientPortalAccess, false, 'Unpaid client must not have client portal access');
  assert.equal(data.snapshot.status, 'payment');
});

test('Slice 01 - T5: Save draft -> client still sees awaiting plan, not draft', async () => {
  const prisma = db();
  const coachEmail = 'coach_slice01@test.internal';
  const clientEmail = 'client_t5_draft@test.internal';

  const coach = await prisma.user.upsert({ where: { email: coachEmail }, update: { role: 'COACH' }, create: { email: coachEmail, role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: clientEmail }, update: { role: 'CLIENT' }, create: { email: clientEmail, role: 'CLIENT' } });

  // Client submitted assessment
  await prisma.clientAssessment.upsert({
    where: { userId: client.id },
    update: { status: 'SUBMITTED', submittedAt: new Date(), deliveryDueAt: new Date(Date.now() + 5 * 86400000) },
    create: { userId: client.id, status: 'SUBMITTED', submittedAt: new Date(), deliveryDueAt: new Date(Date.now() + 5 * 86400000) },
  });

  const coachSession = await issueUserSession(coach.id);
  const clientSession = await issueUserSession(client.id);

  // Coach saves a draft (unpublished)
  const saveDraftReq = new Request(`${ORIGIN}/api/coach/programmes/${client.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({
      version: 'Draft v1',
      training: [{ name: 'Leg Press', sets: '3', reps: '8-12', rest: '120s' }],
      nutrition: [{ meal: 'Breakfast', food: 'Oats · dry', amount: '70 g' }],
      coachNotes: 'Personal drafting in progress',
    }),
  });
  const saveDraftRes = await coachProgrammePut(saveDraftReq, { params: Promise.resolve({ id: client.id }) });
  assert.equal(saveDraftRes.status, 200);

  // Client requests programme -> sees AWAITING_REVIEW with null programme, NOT the draft
  const clientReq = new Request(`${ORIGIN}/api/client/programme`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: clientSession.cookieHeader },
  });
  const clientRes = await clientProgrammeGet(clientReq);
  assert.equal(clientRes.status, 200);
  const clientData = await clientRes.json();
  assert.equal(clientData.status, 'AWAITING_REVIEW');
  assert.equal(clientData.programme, null, 'Unpublished draft must never appear to client');
});

test('Slice 01 - T6: Publish v1 -> client sees exactly one Active training and one Active nutrition version', async () => {
  const prisma = db();
  const coachEmail = 'coach_slice01@test.internal';
  const clientEmail = 'client_t6_publish_v1@test.internal';

  const coach = await prisma.user.upsert({ where: { email: coachEmail }, update: { role: 'COACH' }, create: { email: coachEmail, role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: clientEmail }, update: { role: 'CLIENT' }, create: { email: clientEmail, role: 'CLIENT' } });

  await prisma.clientAssessment.upsert({
    where: { userId: client.id },
    update: { status: 'SUBMITTED', submittedAt: new Date(), deliveryDueAt: new Date(Date.now() + 5 * 86400000) },
    create: { userId: client.id, status: 'SUBMITTED', submittedAt: new Date(), deliveryDueAt: new Date(Date.now() + 5 * 86400000) },
  });

  const coachSession = await issueUserSession(coach.id);
  const clientSession = await issueUserSession(client.id);

  // Coach publishes v1
  const publishReq = new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({
      checksConfirmed: [true, true, true],
      version: 'Active v1',
      training: [{ name: 'Full Body A — Leg Press', sets: '3', reps: '10', rest: '120s' }],
      nutrition: [{ meal: 'Breakfast', food: 'Oats · dry', amount: '70 g' }],
      coachNotes: 'Approved for 3 days beginner by Sahmi El',
    }),
  });
  const publishRes = await coachProgrammePublishPost(publishReq, { params: Promise.resolve({ id: client.id }) });
  assert.equal(publishRes.status, 200);
  const publishData = await publishRes.json();
  assert.equal(publishData.ok, true);
  assert.equal(publishData.programme.version, 'Active v1');

  // Verify only 1 active plan exists in DB
  const activeCount = await prisma.programmeDraft.count({
    where: { clientUserId: client.id, isPublished: true },
  });
  assert.equal(activeCount, 1, 'Exactly one active programme must exist in database');

  // Client requests programme -> receives Active v1
  const clientReq = new Request(`${ORIGIN}/api/client/programme`, {
    method: 'GET',
    headers: { Origin: ORIGIN, Cookie: clientSession.cookieHeader },
  });
  const clientRes = await clientProgrammeGet(clientReq);
  assert.equal(clientRes.status, 200);
  const clientData = await clientRes.json();
  assert.equal(clientData.status, 'ACTIVE');
  assert.equal(clientData.programme.version, 'Active v1');
  assert.ok(clientData.programme.training);
  assert.ok(clientData.programme.nutrition);
});

test('Slice 01 - T7: Publish v2 -> v1 is Superseded and history still references v1', async () => {
  const prisma = db();
  const coachEmail = 'coach_slice01@test.internal';
  const clientEmail = 'client_t7_publish_v2@test.internal';

  const coach = await prisma.user.upsert({ where: { email: coachEmail }, update: { role: 'COACH' }, create: { email: coachEmail, role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: clientEmail }, update: { role: 'CLIENT' }, create: { email: clientEmail, role: 'CLIENT' } });

  await prisma.programmeDraft.deleteMany({ where: { clientUserId: client.id } });

  const coachSession = await issueUserSession(coach.id);

  // 1. Publish v1
  const req1 = new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({
      checksConfirmed: [true, true, true],
      version: 'Active v1',
      training: [{ name: 'Workout v1' }],
      nutrition: [{ food: 'Diet v1' }],
    }),
  });
  await coachProgrammePublishPost(req1, { params: Promise.resolve({ id: client.id }) });

  const v1Record = await prisma.programmeDraft.findFirst({
    where: { clientUserId: client.id, version: 'Active v1' },
  });
  assert.ok(v1Record);
  assert.equal(v1Record.isPublished, true);

  // 2. Publish v2
  const req2 = new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({
      checksConfirmed: [true, true, true],
      version: 'Active v2',
      training: [{ name: 'Workout v2' }],
      nutrition: [{ food: 'Diet v2' }],
    }),
  });
  const res2 = await coachProgrammePublishPost(req2, { params: Promise.resolve({ id: client.id }) });
  assert.equal(res2.status, 200);

  // Check v1 is now superseded
  const updatedV1 = await prisma.programmeDraft.findUnique({ where: { id: v1Record.id } });
  assert.equal(updatedV1!.isPublished, false, 'v1 must now have isPublished: false (superseded)');

  // Check v2 is active
  const v2Record = await prisma.programmeDraft.findFirst({
    where: { clientUserId: client.id, version: 'Active v2' },
  });
  assert.ok(v2Record);
  assert.equal(v2Record.isPublished, true);

  // Exactly 1 published plan in DB
  const activeCount = await prisma.programmeDraft.count({
    where: { clientUserId: client.id, isPublished: true },
  });
  assert.equal(activeCount, 1);
});

test('Slice 01 - T8: Concurrent double publish cannot create two Active versions', async () => {
  const prisma = db();
  const coachEmail = 'coach_slice01@test.internal';
  const clientEmail = 'client_t8_race@test.internal';

  const coach = await prisma.user.upsert({ where: { email: coachEmail }, update: { role: 'COACH' }, create: { email: coachEmail, role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: clientEmail }, update: { role: 'CLIENT' }, create: { email: clientEmail, role: 'CLIENT' } });

  await prisma.programmeDraft.deleteMany({ where: { clientUserId: client.id } });

  const coachSession = await issueUserSession(coach.id);

  const makePublishReq = (ver: string) =>
    new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
      body: JSON.stringify({
        checksConfirmed: [true, true, true],
        version: ver,
        training: [{ name: `Lift ${ver}` }],
        nutrition: [{ food: `Food ${ver}` }],
      }),
    });

  // Launch two publish requests concurrently
  const [resA, resB] = await Promise.all([
    coachProgrammePublishPost(makePublishReq('Active A'), { params: Promise.resolve({ id: client.id }) }),
    coachProgrammePublishPost(makePublishReq('Active B'), { params: Promise.resolve({ id: client.id }) }),
  ]);

  // Both should either serialize cleanly (200) or one fail safely with 409 conflict
  assert.ok([200, 409].includes(resA.status), `resA status was ${resA.status}`);
  assert.ok([200, 409].includes(resB.status), `resB status was ${resB.status}`);
  assert.ok(resA.status === 200 || resB.status === 200, 'At least one publish must succeed');

  const activeCount = await prisma.programmeDraft.count({
    where: { clientUserId: client.id, isPublished: true },
  });
  assert.equal(activeCount, 1, 'Only one active programme can exist even under race conditions');
});

test('Slice 01 - T9: Medical/safety hold is not bypassed and blocks plan publication without clearance', async () => {
  const prisma = db();
  const coachEmail = 'coach_slice01@test.internal';
  const clientEmail = 'client_t9_safety@test.internal';

  const coach = await prisma.user.upsert({ where: { email: coachEmail }, update: { role: 'COACH' }, create: { email: coachEmail, role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: clientEmail }, update: { role: 'CLIENT' }, create: { email: clientEmail, role: 'CLIENT' } });

  // Place client on safety hold
  await prisma.clientAssessment.upsert({
    where: { userId: client.id },
    update: { status: 'SAFETY_HELD', safetyFlags: { flagged: true, reason: 'Knee joint locking reported' } },
    create: { userId: client.id, status: 'SAFETY_HELD', safetyFlags: { flagged: true, reason: 'Knee joint locking reported' } },
  });

  const coachSession = await issueUserSession(coach.id);

  // Coach tries to publish programme while client is on SAFETY_HELD -> 403
  const publishReq = new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({
      checksConfirmed: [true, true, true],
      version: 'Active v1',
      training: [{ name: 'Squats' }],
      nutrition: [{ food: 'Rice' }],
    }),
  });

  const res = await coachProgrammePublishPost(publishReq, { params: Promise.resolve({ id: client.id }) });
  assert.equal(res.status, 403, 'Publishing a programme for client on safety hold must fail with 403');
  const data = await res.json();
  assert.equal(data.error, 'SAFETY_HOLD_ACTIVE');
});

test('Slice 01 - T10: All 3 publish checkpoint confirmation checks are strictly required', async () => {
  const prisma = db();
  const coachEmail = 'coach_slice01@test.internal';
  const clientEmail = 'client_t10_checks@test.internal';

  const coach = await prisma.user.upsert({ where: { email: coachEmail }, update: { role: 'COACH' }, create: { email: coachEmail, role: 'COACH' } });
  const client = await prisma.user.upsert({ where: { email: clientEmail }, update: { role: 'CLIENT' }, create: { email: clientEmail, role: 'CLIENT' } });

  await prisma.clientAssessment.upsert({
    where: { userId: client.id },
    update: { status: 'SUBMITTED' },
    create: { userId: client.id, status: 'SUBMITTED' },
  });

  const coachSession = await issueUserSession(coach.id);

  // Incomplete checks (one is false)
  const req = new Request(`${ORIGIN}/api/coach/programmes/${client.id}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: coachSession.cookieHeader },
    body: JSON.stringify({
      checksConfirmed: [true, false, true],
      version: 'Active v1',
      training: [{ name: 'Bench' }],
      nutrition: [{ food: 'Yoghurt' }],
    }),
  });
  const res = await coachProgrammePublishPost(req, { params: Promise.resolve({ id: client.id }) });
  assert.equal(res.status, 400, 'Publishing without confirming all 3 checks must return 400');
  const data = await res.json();
  assert.equal(data.error, 'ALL_PUBLICATION_CHECKS_REQUIRED');
});
