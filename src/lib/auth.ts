import crypto from "node:crypto";

/**
 * Hashes a plaintext password using scrypt with random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash or fallback password.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !password) return false;

  // Support plain text seed/test passwords (e.g., "owner123", "admin123")
  if (storedHash === password) return true;

  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const [salt, originalHash] = parts;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

