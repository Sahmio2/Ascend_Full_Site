import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import { db } from '../src/server/db';
import { hashPassword } from '../src/server/passwords';

const TEST_PORT = 3009;
const ORIGIN = `http://localhost:${TEST_PORT}`;
let serverProcess: ChildProcess | null = null;

const USER_A_EMAIL = 'http_client_a@test.internal';
const USER_A_PASSWORD = 'ClientA_RealPassword_2026!';
const USER_B_EMAIL = 'http_client_b@test.internal';
const USER_B_PASSWORD = 'ClientB_RealPassword_2026!';

let cookieUserA: string = '';
let cookieUserB: string = '';
let userAObservationId: string = '';

before(async () => {
  const prisma = db();

  // Provision test users in MySQL with secure scrypt hashes
  const hashA = await hashPassword(USER_A_PASSWORD);
  const hashB = await hashPassword(USER_B_PASSWORD);

  // Clean prior test artifacts
  await prisma.session.deleteMany({
    where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
  });
  await prisma.observation.deleteMany({
    where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } },
  });

  await prisma.user.create({
    data: { email: USER_A_EMAIL, passwordHash: hashA, role: 'CLIENT' },
  });
  await prisma.user.create({
    data: { email: USER_B_EMAIL, passwordHash: hashB, role: 'CLIENT' },
  });

  // Spawn Next.js server with APP_ORIGIN matching the test port
  serverProcess = spawn(
    'npx',
    ['next', 'dev', '-p', String(TEST_PORT)],
    {
      detached: true,
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        APP_ORIGIN: ORIGIN,
      },
      stdio: 'pipe',
    }
  );

  // Poll until the server is responding to HTTP requests
  const start = Date.now();
  let isReady = false;
  while (Date.now() - start < 30000) {
    try {
      const res = await fetch(`${ORIGIN}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: ORIGIN,
        },
        body: JSON.stringify({ email: 'test_probe@test.internal', password: 'probe' }),
      });
      // Any standard response (e.g. 401 INVALID_CREDENTIALS) confirms server is live
      if (res.status === 401 || res.status === 200 || res.status === 400) {
        isReady = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  if (!isReady) {
    throw new Error('Next.js dev server failed to start within 30 seconds');
  }
});

after(async () => {
  if (serverProcess && serverProcess.pid) {
    try {
      process.kill(-serverProcess.pid, 'SIGKILL');
    } catch {}
  }

  const prisma = db();
  try {
    await prisma.session.deleteMany({
      where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
    });
    await prisma.observation.deleteMany({
      where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } },
    });
    await prisma.$disconnect();
  } catch {}
});

test('HTTP 1: Cookie issuance on valid login via HTTP POST /api/session', async () => {
  const res = await fetch(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify({
      email: USER_A_EMAIL,
      password: USER_A_PASSWORD,
    }),
  });

  assert.equal(res.status, 200, 'Login must return 200 OK');
  const body = (await res.json()) as { ok: boolean; userId: string; email: string };
  assert.equal(body.ok, true);
  assert.equal(body.email, USER_A_EMAIL);

  const cookieHeader = res.headers.get('set-cookie');
  assert.ok(cookieHeader, 'Set-Cookie header must be returned');
  assert.ok(cookieHeader.includes('ascend_session='), 'Cookie must contain ascend_session token');
  assert.ok(cookieHeader.includes('HttpOnly'), 'Cookie must be HttpOnly');
  assert.ok(cookieHeader.includes('Path=/'), 'Cookie must have Path=/');
  assert.ok(cookieHeader.toLowerCase().includes('samesite=lax'), 'Cookie must have SameSite=Lax');

  // Extract session token cookie for subsequent HTTP requests
  const match = cookieHeader.match(/ascend_session=[a-f0-9]{64}/);
  assert.ok(match, 'Token format must match 64 hex characters');
  cookieUserA = match[0];
});

test('HTTP 2: Protected-route access with issued cookie via HTTP GET /api/progress', async () => {
  // Access with valid session cookie
  const authedRes = await fetch(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`, {
    headers: {
      Cookie: cookieUserA,
    },
  });
  assert.equal(authedRes.status, 200, 'Authenticated request must return 200 OK');
  const data = (await authedRes.json()) as { records: unknown[]; metric: string };
  assert.equal(data.metric, 'BODYWEIGHT_KG');
  assert.ok(Array.isArray(data.records));

  // Access without cookie
  const unauthedRes = await fetch(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`);
  assert.equal(unauthedRes.status, 401, 'Unauthenticated request must return 401');
});

test('HTTP 3: Cross-client isolation between User A and User B via real HTTP', async () => {
  // Log in as User B
  const loginBRes = await fetch(`${ORIGIN}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify({
      email: USER_B_EMAIL,
      password: USER_B_PASSWORD,
    }),
  });
  assert.equal(loginBRes.status, 200);
  const cookieBHeader = loginBRes.headers.get('set-cookie') || '';
  const matchB = cookieBHeader.match(/ascend_session=[a-f0-9]{64}/);
  assert.ok(matchB);
  cookieUserB = matchB[0];

  // User A creates an observation
  const reqId = randomUUID();
  const createRes = await fetch(`${ORIGIN}/api/progress/observations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      Cookie: cookieUserA,
    },
    body: JSON.stringify({
      requestId: reqId,
      metric: 'BODYWEIGHT_KG',
      value: 78.5,
      measuredAt: new Date().toISOString(),
    }),
  });
  assert.equal(createRes.status, 201, 'User A observation creation must return 201');
  const createJson = (await createRes.json()) as { id: string; value: number };
  userAObservationId = createJson.id;
  assert.ok(userAObservationId);

  // User B queries observations -> User A's observation must NOT be present
  const userBProgress = await fetch(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`, {
    headers: {
      Cookie: cookieUserB,
    },
  });
  assert.equal(userBProgress.status, 200);
  const userBData = (await userBProgress.json()) as { records: Array<{ id: string }> };
  const foundAInB = userBData.records.some(r => r.id === userAObservationId);
  assert.equal(foundAInB, false, 'User B must not see User A observation records');

  // User B attempts to delete User A's observation -> must be rejected (404 NOT_FOUND)
  const attackDeleteRes = await fetch(`${ORIGIN}/api/progress/observations`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      Cookie: cookieUserB,
    },
    body: JSON.stringify({
      id: userAObservationId,
    }),
  });
  assert.equal(attackDeleteRes.status, 404, 'User B must not be able to delete User A observation');

  // Confirm User A's observation is still intact and not voided
  const userAProgress = await fetch(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`, {
    headers: {
      Cookie: cookieUserA,
    },
  });
  assert.equal(userAProgress.status, 200);
  const userAData = (await userAProgress.json()) as { records: Array<{ id: string }> };
  const stillExists = userAData.records.some(r => r.id === userAObservationId);
  assert.equal(stillExists, true, 'User A observation must remain active and intact');
});

test('HTTP 4: Logout via HTTP DELETE /api/session revokes session and rejects future requests', async () => {
  // Logout User A
  const logoutRes = await fetch(`${ORIGIN}/api/session`, {
    method: 'DELETE',
    headers: {
      Origin: ORIGIN,
      Cookie: cookieUserA,
    },
  });
  assert.equal(logoutRes.status, 200, 'Logout must return 200 OK');

  const setCookie = logoutRes.headers.get('set-cookie') || '';
  assert.ok(
    setCookie.includes('Max-Age=0') || setCookie.includes('ascend_session=;'),
    'Logout must clear the session cookie'
  );

  // Subsequent request with the logged-out cookie must be rejected with 401
  const afterLogoutRes = await fetch(`${ORIGIN}/api/progress?metric=BODYWEIGHT_KG`, {
    headers: {
      Cookie: cookieUserA,
    },
  });
  assert.equal(afterLogoutRes.status, 401, 'Revoked session cookie must return 401 Unauthorized');
});

