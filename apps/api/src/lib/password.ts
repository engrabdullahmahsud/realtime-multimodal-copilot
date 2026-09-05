/**
 * Password hashing using Node.js built-in crypto.scrypt.
 *
 * scrypt is the same algorithm used by bcrypt and is recommended
 * by OWASP for password storage. Using the built-in implementation
 * means zero external dependencies and native performance.
 *
 * Format: $scrypt$<N>$<r>$<p>$<salt_hex>$<hash_hex>
 * Where N=16384, r=8, p=1 are standard scrypt parameters.
 */

import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

// scrypt parameters (same defaults as the Node.js docs recommend)
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

/**
 * Hash a plaintext password. Returns a storable string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);

  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      const encoded = [
        'scrypt',
        SCRYPT_N.toString(),
        SCRYPT_R.toString(),
        SCRYPT_P.toString(),
        salt.toString('hex'),
        derivedKey.toString('hex'),
      ].join('$');
      resolve(encoded);
    });
  });
}

/**
 * Verify a plaintext password against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');

  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const N = parseInt(parts[1], 10);
  const r = parseInt(parts[2], 10);
  const p = parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], 'hex');
  const storedKey = Buffer.from(parts[5], 'hex');

  return new Promise((resolve, reject) => {
    scrypt(password, salt, storedKey.length, { N, r, p }, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      // Timing-safe comparison prevents timing attacks
      resolve(timingSafeEqual(derivedKey, storedKey));
    });
  });
}
