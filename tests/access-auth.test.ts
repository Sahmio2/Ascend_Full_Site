import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { db } from '../src/server/db';
import { POST as clientStartPost } from '../src/app/api/auth/client/start/route';
import { POST as clientVerifyPost } from '../src/app/api/auth/client/verify/route';
import { POST as recoverPost } from '../src/app/api/auth/recover/route';
import { POST as coachStartPost } from '../src/app/api/auth/coach/start/route';
import { POST as coachVerifyPost } from '../src/app/api/auth/coach/verify/route';
import { GET as snapshotGet } from '../src/app/api/account/snapshot/route';
import { POST as logoutPost } from '../src/app/api/auth/logout/route';
import { POST as assessmentPost } from '../src/app/api/assessment/route';
import { resetLoginRateLimit } from '../src/server/rateLimit';
import { hashPassword } from '../src/server/passwords';

const ORIGIN = 'http://localhost:3000';

after(async () => {
  await db().$disconnect();
});

beforeEach(() => {
  resetLoginRateLimit('access_client@test.internal');
  resetLoginRateLimit('access_brute@test.internal');
  resetLoginRateLimit('access_replay@test.internal');
  resetLoginRateLimit('access_cooldown@test.internal');
  resetLoginRateLimit('coach:coach_test@test.internal');
  resetLoginRateLimit('coach:fake_coach@test.internal');
  resetLoginRateLimit('coach:imposter@test.internal');
});

test('Access 1: Client OTP start generates 6-digit challenge and enforces 60s cooldown', async () => {
  const email = 'access_cooldown@test.internal';

  // Clean any existing challenges
  await db().authChallenge.deleteMany({ where: { identifier: email } });

  // 1. First OTP request
  const req1 = new Request(`${ORIGIN}/api/auth/client/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email }),
  });
  const res1 = await clientStartPost(req1);
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.ok, true);
  assert.ok(data1.expiresAt);

  // Challenge should exist in DB
  const inDb = await db().authChallenge.findFirst({
    where: { identifier: email, challengeType: 'CLIENT_EMAIL_OTP', consumedAt: null },
  });
  assert.ok(inDb, 'Challenge must be stored in DB');
  assert.equal(inDb.codeHash.length, 64, 'Challenge code must be stored as SHA-256 hash');

  // 2. Immediate second request within cooldown window should be throttled (429)
  const req2 = new Request(`${ORIGIN}/api/auth/client/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email }),
  });
  const res2 = await clientStartPost(req2);
  assert.equal(res2.status, 429, 'Immediate second OTP request must trigger 429 cooldown');
});

test('Access 2: Client OTP verify rejects invalid code and locks out after 5 failed attempts', async () => {
  const email = 'access_brute@test.internal';
  await db().authChallenge.deleteMany({ where: { identifier: email } });

  // Request code
  const startReq = new Request(`${ORIGIN}/api/auth/client/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email }),
  });
  const startRes = await clientStartPost(startReq);
  const startData = await startRes.json();
  const validCode = startData.devCode;
  assert.ok(validCode, 'devCode should be returned in test environment');

  // 4 incorrect attempts
  for (let i = 1; i <= 4; i++) {
    const wrongReq = new Request(`${ORIGIN}/api/auth/client/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ email, code: '000000' }),
    });
    const wrongRes = await clientVerifyPost(wrongReq);
    assert.equal(wrongRes.status, 400, `Attempt ${i} should fail with 400`);
  }

  // 5th incorrect attempt -> locks out challenge
  const fifthReq = new Request(`${ORIGIN}/api/auth/client/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, code: '000000' }),
  });
  const fifthRes = await clientVerifyPost(fifthReq);
  assert.equal(fifthRes.status, 429, '5th failed attempt must trigger 429 MAX_ATTEMPTS_EXCEEDED');

  // Even the correct code is now rejected because challenge is locked out
  const lockedReq = new Request(`${ORIGIN}/api/auth/client/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, code: validCode }),
  });
  const lockedRes = await clientVerifyPost(lockedReq);
  assert.equal(lockedRes.status, 400, 'Locked-out challenge must reject even valid code');
});

test('Access 3: Client OTP verify establishes session, sets cookie, and prevents replay', async () => {
  const email = 'access_replay@test.internal';
  await db().authChallenge.deleteMany({ where: { identifier: email } });

  const startReq = new Request(`${ORIGIN}/api/auth/client/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email }),
  });
  const startRes = await clientStartPost(startReq);
  const startData = await startRes.json();
  const validCode = startData.devCode;

  // Verify with valid code
  const verifyReq = new Request(`${ORIGIN}/api/auth/client/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, code: validCode }),
  });
  const verifyRes = await clientVerifyPost(verifyReq);
  assert.equal(verifyRes.status, 200);

  const setCookie = verifyRes.headers.get('Set-Cookie');
  assert.ok(setCookie?.includes('ascend_session='), 'Response must issue ascend_session cookie');
  assert.ok(setCookie?.includes('HttpOnly'), 'Cookie must be HttpOnly');

  const verifyData = await verifyRes.json();
  assert.equal(verifyData.ok, true);
  assert.ok(verifyData.snapshot);
  assert.ok(verifyData.nextPath);

  // Attempt to replay the same code -> Must fail closed
  const replayReq = new Request(`${ORIGIN}/api/auth/client/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, code: validCode }),
  });
  const replayRes = await clientVerifyPost(replayReq);
  assert.equal(replayRes.status, 400, 'Replaying a consumed OTP challenge must fail closed');
});

test('Access 4: Account recovery preserves anti-enumeration on unknown emails', async () => {
  const unknownEmail = 'does_not_exist_ever_12345@test.internal';
  const req = new Request(`${ORIGIN}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: unknownEmail }),
  });
  const res = await recoverPost(req);
  assert.equal(res.status, 200, 'Recovery must return 200 without leaking account absence');
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.nextPath, '/verify-email');
});

test('Access 5: Coach login rejects non-coach users, requires password + MFA before session issuance', async () => {
  const prisma = db();
  const coachEmail = 'coach_test@test.internal';
  const clientEmail = 'imposter@test.internal';
  const password = 'CorrectCoachPassword123!';
  const pHash = await hashPassword(password);

  // Upsert coach user
  await prisma.user.upsert({
    where: { email: coachEmail },
    update: { passwordHash: pHash, role: 'COACH' },
    create: { email: coachEmail, passwordHash: pHash, role: 'COACH' },
  });

  // Upsert client user with same password
  await prisma.user.upsert({
    where: { email: clientEmail },
    update: { passwordHash: pHash, role: 'CLIENT' },
    create: { email: clientEmail, passwordHash: pHash, role: 'CLIENT' },
  });

  // 1. Client attempts coach login -> Rejected with 401
  const imposterReq = new Request(`${ORIGIN}/api/auth/coach/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: clientEmail, password }),
  });
  const imposterRes = await coachStartPost(imposterReq);
  assert.equal(imposterRes.status, 401, 'Non-coach role must be rejected on coach start');

  // 2. Coach with wrong password -> Rejected with 401
  const wrongPassReq = new Request(`${ORIGIN}/api/auth/coach/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: coachEmail, password: 'WrongPassword' }),
  });
  const wrongPassRes = await coachStartPost(wrongPassReq);
  assert.equal(wrongPassRes.status, 401, 'Wrong password must be rejected');

  // 3. Coach with correct password -> Receives MFA challenge
  await prisma.authChallenge.deleteMany({ where: { identifier: coachEmail } });
  const startReq = new Request(`${ORIGIN}/api/auth/coach/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: coachEmail, password }),
  });
  const startRes = await coachStartPost(startReq);
  assert.equal(startRes.status, 200);
  const startData = await startRes.json();
  assert.equal(startData.nextPath, '/coach/verify');
  const mfaCode = startData.devCode;
  assert.ok(mfaCode, 'devCode for coach MFA must be generated');

  // 4. Coach completes MFA verification
  const verifyReq = new Request(`${ORIGIN}/api/auth/coach/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: coachEmail, code: mfaCode }),
  });
  const verifyRes = await coachVerifyPost(verifyReq);
  assert.equal(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.role, 'COACH');
  assert.equal(verifyData.nextPath, '/coach-portal');
  assert.ok(verifyRes.headers.get('Set-Cookie')?.includes('ascend_session='));
});

test('Access 6: GET /api/account/snapshot returns server-authoritative state and logout clears session', async () => {
  const prisma = db();
  const email = 'access_client@test.internal';

  await prisma.authChallenge.deleteMany({ where: { identifier: email } });
  const startReq = new Request(`${ORIGIN}/api/auth/client/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email }),
  });
  const startRes = await clientStartPost(startReq);
  const code = (await startRes.json()).devCode;

  // Verify and obtain session cookie
  const verifyReq = new Request(`${ORIGIN}/api/auth/client/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, code }),
  });
  const verifyRes = await clientVerifyPost(verifyReq);
  const cookieHeader = verifyRes.headers.get('Set-Cookie')!;
  const token = cookieHeader.match(/ascend_session=([a-f0-9]{64})/)?.[1]!;

  // 1. Fetch snapshot with session cookie
  const snapReq = new Request(`${ORIGIN}/api/account/snapshot`, {
    headers: { Cookie: `ascend_session=${token}` },
  });
  const snapRes = await snapshotGet(snapReq);
  assert.equal(snapRes.status, 200);
  const snapData = await snapRes.json();
  assert.equal(snapData.snapshot.email, email);
  assert.ok(snapData.snapshot.status);
  assert.ok(snapData.snapshot.badge);

  // 2. Submit assessment
  const assessReq = new Request(`${ORIGIN}/api/assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      Cookie: `ascend_session=${token}`,
    },
    body: JSON.stringify({
      answers: {
        'FT-01': { name: 'Access Athlete' },
        'BS-02': 'No',
        'BS-03': 'No',
      },
      isSubmitted: true,
    }),
  });
  const assessRes = await assessmentPost(assessReq);
  assert.equal(assessRes.status, 200);
  const assessData = await assessRes.json();
  assert.equal(assessData.assessment.status, 'SUBMITTED');

  // 3. Logout
  const logoutReq = new Request(`${ORIGIN}/api/auth/logout`, {
    method: 'POST',
    headers: { Origin: ORIGIN, Cookie: `ascend_session=${token}` },
  });
  const logoutRes = await logoutPost(logoutReq);
  assert.equal(logoutRes.status, 200);
  assert.ok(logoutRes.headers.get('Set-Cookie')?.includes('Max-Age=0'));

  // 4. Protected snapshot call now fails closed
  const deadSnapReq = new Request(`${ORIGIN}/api/account/snapshot`, {
    headers: { Cookie: `ascend_session=${token}` },
  });
  const deadSnapRes = await snapshotGet(deadSnapReq);
  assert.equal(deadSnapRes.status, 401, 'Revoked session must fail closed with 401');
});
