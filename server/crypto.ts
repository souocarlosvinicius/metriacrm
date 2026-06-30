import crypto from "crypto";

/**
 * Secures a password using Node's native PBKDF2.
 * Output format: "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 * Fallbacks to plain text check if the stored value is not a PBKDF2 format.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (!storedHash.includes(":")) {
    // Fallback for plain-text legacy passwords like "123"
    return password === storedHash;
  }
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === testHash;
}
