import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = "sha512";

/**
 * Secures a password using Node's native PBKDF2.
 * Output format: "salt:hash:iterations"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}:${ITERATIONS}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 * Requires a proper PBKDF2 format. No plain text fallbacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  
  const parts = storedHash.split(":");
  if (parts.length < 2) {
    // Strictly block plain-text/legacy raw passwords here
    return false;
  }
  
  const salt = parts[0];
  const hash = parts[1];
  const iterations = parts[2] ? parseInt(parts[2], 10) : 1000;
  
  const testHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
  
  const hashBuf = Buffer.from(hash, "hex");
  const testHashBuf = Buffer.from(testHash, "hex");
  
  if (hashBuf.length !== testHashBuf.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(hashBuf, testHashBuf);
}

/**
 * Helper to check if a password stored in DB is plaintext.
 */
export function isPlaintextPassword(stored: string): boolean {
  if (!stored) return false;
  return !stored.includes(":");
}

