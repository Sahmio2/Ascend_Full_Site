import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as verifyPayment } from '../src/app/api/billing/verify/route';
import { GET as readAssessment } from '../src/app/api/assessment/route';
import { tokenHash } from '../src/server/auth';

const token = 'a'.repeat(64);
const userId = 'client-one';
const reference = 'asc_test_checkout';
const signedIn = { Cookie: `ascend_session=${token}` };
const local = globalThis as typeof globalThis & { ascendDb?: object };

test('A payment reference only activates its owning account, and assessment checks the paid period', async () => {
  const previousDb = local.ascendDb;
  const env: Record<string, string | undefined> = process.env;
  const previousMode = env.NODE_ENV;
  env.NODE_ENV = 'test';
  let owner = 'client-two';
  let paymentStatus = 'PENDING';
  let membership: { status: string; paidThrough: Date } | null = null;
  let activations = 0;
  const prisma = {
    session: { findUnique: async ({ where }: { where: { tokenHash: string } }) => {
      assert.equal(where.tokenHash, tokenHash(token));
      return { userId, expiresAt: new Date(Date.now() + 60_000), revokedAt: null };
    } },
    registrantScreening: { findUnique: async () => null },
    clientAssessment: { findUnique: async () => null, upsert: async () => ({}) },
    payment: {
      findUnique: async ({ where }: { where: { userId: string } }) => where.userId === owner
        ? { reference, userId: owner, amountKobo: 4_000_000, currency: 'NGN', status: paymentStatus }
        : null,
      findUniqueOrThrow: async () => ({ amountKobo: 4_000_000, rawMetadata: null }),
      updateMany: async () => {
        if (paymentStatus !== 'PENDING') return { count: 0 };
        paymentStatus = 'SUCCESS';
        return { count: 1 };
      },
    },
    membership: {
      findUnique: async () => membership,
      upsert: async ({ create }: { create: NonNullable<typeof membership> }) => {
        activations++;
        membership = create;
        return membership;
      },
    },
    waitlistEntry: { deleteMany: async () => ({ count: 0 }) },
  };
  local.ascendDb = { ...prisma, $transaction: (fn: (tx: typeof prisma) => unknown) => fn(prisma) };
  const check = () => verifyPayment(new Request(`http://localhost/api/billing/verify?reference=${reference}`, { headers: signedIn }));
  const assess = () => readAssessment(new Request('http://localhost/api/assessment', { headers: signedIn }));
  try {
    assert.equal((await assess()).status, 403);
    assert.equal((await check()).status, 404);
    assert.equal(activations, 0);

    owner = userId;
    const callbacks = await Promise.all([check(), check()]);
    assert.deepEqual(callbacks.map(response => response.status), [200, 200]);
    assert.equal(activations, 1);
    assert.equal((await assess()).status, 200);

    membership = { status: 'NON_RENEWING', paidThrough: new Date(0) };
    assert.equal((await check()).status, 409);
    assert.equal((await assess()).status, 403);
    assert.equal(activations, 1);
  } finally {
    local.ascendDb = previousDb;
    if (previousMode === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousMode;
  }
});
