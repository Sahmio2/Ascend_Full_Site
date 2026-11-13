import crypto from 'node:crypto';
import { db } from './db';
import { ApiError } from './http';
import type { ChallengeType } from '../generated/prisma/client';

export const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const MAX_CHALLENGE_ATTEMPTS = 5;

function hashChallengeCode(code: string, identifier: string): string {
  return crypto.createHash('sha256').update(`${code}:${identifier}`).digest('hex');
}

export interface CreateChallengeResult {
  challengeId: string;
  expiresAt: Date;
  /** Available in test mode or local development */
  devCode?: string;
}

/**
 * Creates a cryptographically random 6-digit OTP challenge.
 * Enforces resend cooldown, invalidates older unconsumed challenges, and hashes the OTP.
 */
export async function createAuthChallenge({
  identifier,
  type,
  client = db(),
}: {
  identifier: string;
  type: ChallengeType;
  client?: ReturnType<typeof db>;
}): Promise<CreateChallengeResult> {
  const normalizedId = identifier.toLowerCase().trim();
  const now = new Date();

  // Check for active challenge within cooldown window
  const recentChallenge = await client.authChallenge.findFirst({
    where: {
      identifier: normalizedId,
      challengeType: type,
      consumedAt: null,
      createdAt: { gt: new Date(now.getTime() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentChallenge) {
    const remainingSec = Math.ceil(
      (recentChallenge.createdAt.getTime() + RESEND_COOLDOWN_MS - now.getTime()) / 1000
    );
    throw new ApiError(429, `RESEND_COOLDOWN_ACTIVE:${remainingSec}`);
  }

  // Consume any previous unexpired challenges for this identifier & type
  await client.authChallenge.updateMany({
    where: {
      identifier: normalizedId,
      challengeType: type,
      consumedAt: null,
    },
    data: { consumedAt: now },
  });

  // Generate 6-digit numeric OTP (100000 - 999999)
  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashChallengeCode(code, normalizedId);
  const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS);

  const record = await client.authChallenge.create({
    data: {
      identifier: normalizedId,
      codeHash,
      challengeType: type,
      expiresAt,
      maxAttempts: MAX_CHALLENGE_ATTEMPTS,
    },
  });

  // Log in dev / test mode so engineers and automated tests can observe challenge delivery
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    console.log(`[AUTH CHALLENGE] ${type} code for ${normalizedId}: ${code}`);
  }

  return {
    challengeId: record.id,
    expiresAt,
    devCode: process.env.NODE_ENV === 'test' || !process.env.VERCEL ? code : undefined,
  };
}

/**
 * Verifies a 6-digit OTP challenge against constant-time SHA-256 hash comparison.
 * Increments attempt count and locks out after maxAttempts.
 */
export async function verifyAuthChallenge({
  identifier,
  code,
  type,
  client = db(),
}: {
  identifier: string;
  code: string;
  type: ChallengeType;
  client?: ReturnType<typeof db>;
}): Promise<boolean> {
  const normalizedId = identifier.toLowerCase().trim();
  const normalizedCode = code.trim();
  const now = new Date();

  const challenge = await client.authChallenge.findFirst({
    where: {
      identifier: normalizedId,
      challengeType: type,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    throw new ApiError(400, 'CHALLENGE_EXPIRED_OR_NOT_FOUND');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    // Invalidate immediately
    await client.authChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now },
    });
    throw new ApiError(429, 'MAX_ATTEMPTS_EXCEEDED');
  }

  const computedHash = hashChallengeCode(normalizedCode, normalizedId);
  const expectedBuf = Buffer.from(challenge.codeHash, 'hex');
  const actualBuf = Buffer.from(computedHash, 'hex');

  const isMatch =
    expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

  const newAttempts = challenge.attempts + 1;
  const isLockedOut = !isMatch && newAttempts >= challenge.maxAttempts;

  await client.authChallenge.update({
    where: { id: challenge.id },
    data: {
      attempts: { increment: 1 },
      ...(isMatch || isLockedOut ? { consumedAt: now } : {}),
    },
  });

  if (!isMatch) {
    if (isLockedOut) {
      throw new ApiError(429, 'MAX_ATTEMPTS_EXCEEDED');
    }
    const remaining = challenge.maxAttempts - newAttempts;
    throw new ApiError(400, `INVALID_CODE:${remaining}`);
  }

  return true;
}
