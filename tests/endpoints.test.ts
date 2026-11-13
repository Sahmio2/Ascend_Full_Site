import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { db } from '../src/server/db';
import { POST as sessionPost, DELETE as sessionDelete, resetLoginRateLimit } from '../src/app/api/session/route';
import { GET as progressGet } from '../src/app/api/progress/route';

const ORIGIN = 'http://localhost:3000';

after(async () => {
  await db().$disconnect();
});

beforeEach(() => {
  resetLoginRateLimit('attacker@test.internal');
  resetLoginRateLimit('victim@test.internal');
  resetLoginRateLimit('ratelimit@test.internal');
  resetLoginRateLimit('rotation_test@test.internal');
  resetLoginRateLimit('logout_test@test.internal');
});

test('Endpoint 1: Rejects impersonation attempts with email only or userId', async () => {
  // Attempt 1: Email only without password
  const req1 = new Request(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: 'victim@test.internal' }),
  });
  const res1 = await sessionPost(req1);
  assert.equal(res1.status, 400, 'Email-only submission must be rejected with 400');
  const json1 = await res1.json();
  assert.equal(json1.error, 'INVALID_INPUT');

  // Attempt 2: Supplying userId alone
  const req2 = new Request(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ userId: 'stolen-id-12345' }),
  });
  const res2 = await sessionPost(req2);
  assert.equal(res2.status, 400, 'userId-only submission must be rejected with 400');
});

test('Endpoint 2: Rejects invalid credentials with 401', async () => {
  const req = new Request(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: 'attacker@test.internal', password: '123' }),
  });
  const res = await sessionPost(req);
  assert.equal(res.status, 401, 'Invalid credentials must return 401');
  const json = await res.json();
  assert.equal(json.error, 'INVALID_CREDENTIALS');
});

test('Endpoint 3: Blocks demo-login bypass in production mode', async () => {
  const env = process.env as Record<string, string | undefined>;
  const prevEnv = env.NODE_ENV;
  const prevDev = env.ALLOW_DEV_SESSIONS;
  try {
    env.NODE_ENV = 'production';
    delete env.ALLOW_DEV_SESSIONS;

    const req = new Request(`${ORIGIN}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ email: 'demo@ascend.co', password: 'ascend-demo' }),
    });
    const res = await sessionPost(req);
    assert.equal(res.status, 403, 'Demo login in production must return 403 Forbidden');
    const json = await res.json();
    assert.equal(json.error, 'DEMO_LOGIN_DISABLED_IN_PRODUCTION');
  } finally {
    env.NODE_ENV = prevEnv;
    if (prevDev) env.ALLOW_DEV_SESSIONS = prevDev;
  }
});

test('Endpoint 4: Enforces login rate limiting on repeated failed attempts', async () => {
  const targetEmail = 'ratelimit@test.internal';
  resetLoginRateLimit(targetEmail);

  let lastStatus = 0;
  for (let i = 0; i < 6; i++) {
    const req = new Request(`${ORIGIN}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ email: targetEmail, password: 'wrong' }),
    });
    const res = await sessionPost(req);
    lastStatus = res.status;
  }

  assert.equal(lastStatus, 429, '6th rapid attempt must trigger 429 Too Many Requests');
  resetLoginRateLimit(targetEmail);
});

test('Endpoint 5: Sets secure cookie attributes and rotates previous sessions', async () => {
  const prisma = db();
  const testEmail = 'rotation_test@test.internal';

  // Ensure clean state before test
  await prisma.session.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  // Perform first login
  const req1 = new Request(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: testEmail, password: 'secure_password_123' }),
  });
  const res1 = await sessionPost(req1);
  assert.equal(res1.status, 200, 'Login must succeed');

  const cookieHeader = res1.headers.get('set-cookie');
  assert.ok(cookieHeader, 'Set-Cookie header must be present');
  assert.ok(cookieHeader.includes('HttpOnly'), 'Cookie must have HttpOnly');
  assert.ok(cookieHeader.includes('Path=/'), 'Cookie must have Path=/');
  assert.ok(cookieHeader.toLowerCase().includes('samesite=lax'), 'Cookie must have SameSite=Lax');

  const user = await prisma.user.findUnique({ where: { email: testEmail } });
  assert.ok(user);

  const activeSessionsBefore = await prisma.session.count({
    where: { userId: user.id, revokedAt: null },
  });
  assert.equal(activeSessionsBefore, 1);

  // Perform second login for same user (trigger session rotation)
  const req2 = new Request(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: testEmail, password: 'secure_password_123' }),
  });
  const res2 = await sessionPost(req2);
  assert.equal(res2.status, 200);

  const allUserSessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { expiresAt: 'asc' },
  });
  assert.equal(allUserSessions.length, 2, 'Should have 2 historical sessions in DB');
  assert.ok(allUserSessions[0].revokedAt !== null, 'Prior session must be revoked');
  assert.equal(allUserSessions[1].revokedAt, null, 'New session must be active');

  // Clean up
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
});

test('Endpoint 6: Rejects unauthenticated and revoked sessions on protected routes', async () => {
  // Call GET /api/progress without any cookie
  const unauthReq = new Request(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`);
  const unauthRes = await progressGet(unauthReq);
  assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');

  // Call GET /api/progress with bogus cookie
  const bogusReq = new Request(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`, {
    headers: { Cookie: 'ascend_session=0000000000000000000000000000000000000000000000000000000000000000' },
  });
  const bogusRes = await progressGet(bogusReq);
  assert.equal(bogusRes.status, 401, 'Bogus session must return 401');
});

test('Endpoint 7: Logout revokes session in DB and rejects future requests', async () => {
  const prisma = db();
  const testEmail = 'logout_test@test.internal';

  // Perform login
  const loginReq = new Request(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: testEmail, password: 'secure_password_123' }),
  });
  const loginRes = await sessionPost(loginReq);
  assert.equal(loginRes.status, 200);

  const cookieHeader = loginRes.headers.get('set-cookie') || '';
  const match = cookieHeader.match(/ascend_session=([a-f0-9]{64})/);
  assert.ok(match, 'Token must be present in cookie');
  const token = match[1];

  // Logout via DELETE /api/session
  const logoutReq = new Request(`${ORIGIN}/api/session`, {
    method: 'DELETE',
    headers: {
      Cookie: `ascend_session=${token}`,
      Origin: ORIGIN,
    },
  });
  const logoutRes = await sessionDelete(logoutReq);
  assert.equal(logoutRes.status, 200, 'Logout must return 200');

  // Verify in MySQL that session is revoked
  const sessionInDb = await prisma.session.findFirst({
    where: { user: { email: testEmail } },
  });
  assert.ok(sessionInDb);
  assert.ok(sessionInDb.revokedAt !== null, 'Session must be marked revoked in database');

  // Verify that GET /api/progress with that token now returns 401
  const afterLogoutReq = new Request(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`, {
    headers: { Cookie: `ascend_session=${token}` },
  });
  const afterLogoutRes = await progressGet(afterLogoutReq);
  assert.equal(afterLogoutRes.status, 401, 'Revoked token must return 401');

  // Clean up
  await prisma.session.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });
});
