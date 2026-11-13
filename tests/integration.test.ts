import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import { db } from '../src/server/db';
import { sessionIsActive } from '../src/server/auth';
import { observationData, checkReplay, ownedRecord } from '../src/server/observations';
import { observationInput } from '../src/contracts/progress';

after(async () => {
  await db().$disconnect();
});

test('1. Prisma connects to local XAMPP MySQL and core tables exist', async () => {
  const prisma = db();
  const tableCheck = await prisma.$queryRaw<Array<{ tableName: string }>>`
    SELECT table_name as tableName FROM information_schema.tables 
    WHERE table_schema = 'ascend' AND table_name IN ('User', 'Session', 'Observation', 'AchievementGroup');
  `;
  assert.equal(tableCheck.length, 4, 'Expected core tables to exist in ascend schema');
});

test('2. Achievement catalogue data is populated', async () => {
  const prisma = db();
  const groupCount = await prisma.achievementGroup.count();
  const defCount = await prisma.achievementDefinition.count();
  assert.equal(groupCount, 8, 'Expected 8 achievement groups');
  assert.equal(defCount, 96, 'Expected 96 achievement definitions');
});

test('3. Unauthenticated sessions fail closed', () => {
  assert.equal(sessionIsActive(null), false, 'Null session must be inactive');
  const expiredSession = { expiresAt: new Date(Date.now() - 10000), revokedAt: null };
  assert.equal(sessionIsActive(expiredSession), false, 'Expired session must be inactive');
  const revokedSession = { expiresAt: new Date(Date.now() + 100000), revokedAt: new Date() };
  assert.equal(sessionIsActive(revokedSession), false, 'Revoked session must be inactive');
});

test('4. Cross-client isolation: User B cannot view or modify User A records', async () => {
  const prisma = db();
  const userA = await prisma.user.upsert({
    where: { email: 'client_a@test.internal' },
    create: { email: 'client_a@test.internal', role: 'CLIENT' },
    update: {},
  });
  const userB = await prisma.user.upsert({
    where: { email: 'client_b@test.internal' },
    create: { email: 'client_b@test.internal', role: 'CLIENT' },
    update: {},
  });

  // Clean test records for these users
  await prisma.observation.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  });

  const reqIdA = randomUUID();
  const inputA = observationInput.parse({
    requestId: reqIdA,
    metric: 'BODYWEIGHT_KG',
    value: 82.5,
    measuredAt: new Date().toISOString(),
  });
  const dataA = observationData(userA.id, inputA);

  // User A records an observation
  const savedA = await prisma.observation.create({ data: dataA });
  assert.equal(Number(savedA.value), 82.5);

  // User B queries observations
  const userBRecords = await prisma.observation.findMany({
    where: { userId: userB.id, voidedAt: null },
  });
  assert.equal(userBRecords.length, 0, 'User B must not see User A records');

  // User B attempts to soft-delete User A record
  const crossDelete = await prisma.observation.updateMany({
    where: ownedRecord(userB.id, savedA.id),
    data: { voidedAt: new Date() },
  });
  assert.equal(crossDelete.count, 0, 'User B cannot delete User A record');

  // Verify User A record remains active
  const refreshedA = await prisma.observation.findMany({
    where: { userId: userA.id, voidedAt: null },
  });
  assert.equal(refreshedA.length, 1);
  assert.equal(refreshedA[0].id, savedA.id);
  assert.equal(Number(refreshedA[0].value), 82.5);

  // Clean up
  await prisma.observation.deleteMany({
    where: { userId: { in: [userA.id, userB.id] } },
  });
});

test('5. Saving measurement, idempotency replay, and soft deletion', async () => {
  const prisma = db();
  const user = await prisma.user.upsert({
    where: { email: 'client_persistence@test.internal' },
    create: { email: 'client_persistence@test.internal', role: 'CLIENT' },
    update: {},
  });

  await prisma.observation.deleteMany({ where: { userId: user.id } });

  const reqId = randomUUID();
  const input = observationInput.parse({
    requestId: reqId,
    metric: 'BODYWEIGHT_KG',
    value: 77.25,
    measuredAt: new Date().toISOString(),
  });
  const data = observationData(user.id, input);

  // 1. Save measurement
  const saved = await prisma.observation.create({ data });
  assert.equal(Number(saved.value), 77.25);

  // 2. Refresh/refetch: Confirm measurement persists
  const refetched = await prisma.observation.findUnique({
    where: { id: saved.id },
  });
  assert.ok(refetched, 'Record must exist upon refresh');
  assert.equal(Number(refetched.value), 77.25);

  // 3. Exact replay check
  checkReplay(refetched, data.payloadHash);

  // 4. Conflicting replay with different value throws
  const conflicting = observationData(user.id, { ...input, value: 79.0 });
  assert.throws(() => checkReplay(refetched, conflicting.payloadHash), /IDEMPOTENCY_CONFLICT/);

  // 5. Soft deletion
  const del = await prisma.observation.updateMany({
    where: ownedRecord(user.id, saved.id),
    data: { voidedAt: new Date() },
  });
  assert.equal(del.count, 1);

  const active = await prisma.observation.findMany({
    where: { userId: user.id, voidedAt: null },
  });
  assert.equal(active.length, 0, 'Soft deleted record must not appear in active query');

  // Clean up
  await prisma.observation.deleteMany({ where: { userId: user.id } });
});

