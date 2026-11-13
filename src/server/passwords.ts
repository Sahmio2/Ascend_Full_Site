import { scrypt, randomBytes, timingSafeEqual, type ScryptOptions, type BinaryLike } from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const MAX_MEM = 32 * 1024 * 1024;

function scryptAsync(
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

/**
 * Derives a cryptographic hash of a plaintext password using scrypt.
 * Output format: scrypt$N=16384,r=8,p=1$<salt_hex>$<derived_key_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  });

  return `scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

/**
 * Securely verifies a plaintext password against a stored scrypt hash.
 * Existing accounts without credentials (null/undefined/empty) FAIL CLOSED immediately.
 * Uses constant-time comparison (timingSafeEqual) to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  // Fail-closed on missing credentials or invalid inputs
  if (!storedHash || typeof storedHash !== 'string' || !password || typeof password !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  // Format: ["scrypt", "N=16384,r=8,p=1", "<salt_hex>", "<derived_key_hex>"]
  if (parts.length !== 4 || parts[0] !== 'scrypt') {
    return false;
  }

  const paramsStr = parts[1];
  const saltHex = parts[2];
  const expectedKeyHex = parts[3];

  let n = SCRYPT_N;
  let r = SCRYPT_R;
  let p = SCRYPT_P;

  for (const pair of paramsStr.split(',')) {
    const [k, v] = pair.split('=');
    const num = parseInt(v, 10);
    if (isNaN(num)) return false;
    if (k === 'N') n = num;
    else if (k === 'r') r = num;
    else if (k === 'p') p = num;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(expectedKeyHex, 'hex');

  if (salt.length === 0 || expectedKey.length === 0) {
    return false;
  }

  try {
    const derivedKey = await scryptAsync(password, salt, expectedKey.length, {
      N: n,
      r,
      p,
      maxmem: MAX_MEM,
    });

    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}
