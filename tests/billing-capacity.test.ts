import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import 'dotenv/config';
import { db } from '../src/server/db';
import {
  reserveCapacitySlot,
  commitCapacityReservation,
  getCapacityStatus,
  getLagosWeekKey,
  DEFAULT_MAX_ACTIVE_CLIENTS,
} from '../src/server/capacity';
import { verifyPaystackWebhookSignature, ASCEND_MONTHLY_PRICE_KOBO } from '../src/server/paystack';

const TEST_USER_PREFIX = 'billing_test_';

before(async () => {
  const prisma = db();
  // Clean prior billing test records
  await prisma.payment.deleteMany({
    where: { user: { email: { startsWith: TEST_USER_PREFIX } } },
  });
  await prisma.capacityReservation.deleteMany({
    where: { user: { email: { startsWith: TEST_USER_PREFIX } } },
  });
  await prisma.membership.deleteMany({
    where: { user: { email: { startsWith: TEST_USER_PREFIX } } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: TEST_USER_PREFIX } },
  });
});

after(async () => {
  const prisma = db();
  await prisma.payment.deleteMany({
    where: { user: { email: { startsWith: TEST_USER_PREFIX } } },
  });
  await prisma.capacityReservation.deleteMany({
    where: { user: { email: { startsWith: TEST_USER_PREFIX } } },
  });
  await prisma.membership.deleteMany({
    where: { user: { email: { startsWith: TEST_USER_PREFIX } } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: TEST_USER_PREFIX } },
  });
  await prisma.$disconnect();
});

test('Billing 1: Computes Lagos ISO week key accurately', () => {
  const weekKey = getLagosWeekKey();
  assert.match(weekKey, /^\d{4}-W\d{2}$/);
});

test('Billing 2: getCapacityStatus reports capacity and policy invariants', async () => {
  const status = await getCapacityStatus();
  assert.equal(status.policy.maxActiveClients, 10);
  assert.equal(status.policy.maxWeeklyOnboardings, 3);
  assert.equal(typeof status.remainingSeats, 'number');
  assert.equal(typeof status.remainingWeeklyOnboardings, 'number');
  assert.equal(typeof status.isAvailable, 'boolean');
});

test('Billing 3: reserveCapacitySlot grants 30-min reservation and commits on fulfillment', async () => {
  const prisma = db();
  const testUser = await prisma.user.create({
    data: {
      email: `${TEST_USER_PREFIX}res_1@test.internal`,
      role: 'CLIENT',
    },
  });

  const reservation = await reserveCapacitySlot(testUser.id);
  assert.ok(reservation.token);
  assert.equal(reservation.isExisting, false);
  assert.ok(reservation.expiresAt.getTime() > Date.now());

  // Confirm DB record
  const dbReservation = await prisma.capacityReservation.findUnique({
    where: { token: reservation.token },
  });
  assert.ok(dbReservation);
  assert.equal(dbReservation.status, 'PENDING');

  // Calling again for same user returns existing valid reservation
  const secondCall = await reserveCapacitySlot(testUser.id);
  assert.equal(secondCall.token, reservation.token);
  assert.equal(secondCall.isExisting, true);

  // Commit reservation
  const committed = await commitCapacityReservation(reservation.token);
  assert.ok(committed);
  assert.equal(committed.status, 'COMMITTED');
});

test('Billing 4: Webhook HMAC-SHA512 raw byte verification rejects tampered requests', () => {
  const fakeSecret = 'sk_test_fake_secret_key_12345';
  process.env.PAYSTACK_SECRET_KEY = fakeSecret;

  const rawPayload = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_123' } }), 'utf8');
  const validSignature = crypto.createHmac('sha512', fakeSecret).update(rawPayload).digest('hex');

  // 1. Valid signature passes
  assert.equal(verifyPaystackWebhookSignature(rawPayload, validSignature), true);

  // 2. Tampered signature fails
  const badSignature = 'a'.repeat(128);
  assert.equal(verifyPaystackWebhookSignature(rawPayload, badSignature), false);

  // 3. Tampered payload fails
  const tamperedPayload = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_999' } }), 'utf8');
  assert.equal(verifyPaystackWebhookSignature(tamperedPayload, validSignature), false);

  // 4. Missing signature fails
  assert.equal(verifyPaystackWebhookSignature(rawPayload, null), false);
});

test('Billing 5: Weekly onboarding limit throttles after 3 slots in same week', async () => {
  const prisma = db();
  const users = await Promise.all([
    prisma.user.create({ data: { email: `${TEST_USER_PREFIX}wk_1@test.internal`, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${TEST_USER_PREFIX}wk_2@test.internal`, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${TEST_USER_PREFIX}wk_3@test.internal`, role: 'CLIENT' } }),
    prisma.user.create({ data: { email: `${TEST_USER_PREFIX}wk_4@test.internal`, role: 'CLIENT' } }),
  ]);

  // Clean any active reservations created in other tests for the current week
  const weekKey = getLagosWeekKey();
  await prisma.capacityReservation.updateMany({
    where: { weekKey },
    data: { status: 'CANCELLED' },
  });

  // Slot 1
  const res1 = await reserveCapacitySlot(users[0].id);
  assert.ok(res1.token);

  // Slot 2
  const res2 = await reserveCapacitySlot(users[1].id);
  assert.ok(res2.token);

  // Slot 3
  const res3 = await reserveCapacitySlot(users[2].id);
  assert.ok(res3.token);

  // Slot 4 must fail with CAPACITY_FULL_WEEKLY_3
  await assert.rejects(
    async () => {
      await reserveCapacitySlot(users[3].id);
    },
    (err: Error) => err.message === 'CAPACITY_FULL_WEEKLY_3'
  );
});
