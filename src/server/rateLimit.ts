import { ApiError } from '@/server/http';

// In-memory rate limiter: max 5 login attempts per key (email/IP) per minute
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && record.resetAt > now) {
    if (record.count >= MAX_ATTEMPTS) {
      throw new ApiError(429, 'TOO_MANY_REQUESTS');
    }
    record.count++;
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
}

export function resetLoginRateLimit(key: string) {
  loginAttempts.delete(key);
}

