import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_LEN = 16; // bytes → 32 hex chars
const KEY_LEN = 32;  // bytes → 64 hex chars

/**
 * Hash a plaintext password using scrypt.
 * Returns a string in the format "<hexSalt>:<hexHash>".
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a plaintext password against a stored "<hexSalt>:<hexHash>" string.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const storedHash = Buffer.from(hashHex, 'hex');
  const derivedHash = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return timingSafeEqual(storedHash, derivedHash);
}
