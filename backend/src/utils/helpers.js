import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

/** Generate a UUID v4. */
export const generateUUID = () => uuidv4();

/** Generate a cryptographically secure random hex string. */
export const generateRandomHex = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

/** SHA-256 hash a plaintext string (for API key storage). */
export const sha256 = (plaintext) =>
  crypto.createHash('sha256').update(plaintext).digest('hex');

/** Constant-time comparison to prevent timing attacks. */
export const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/** Strip undefined keys from an object (useful for patch updates). */
export const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/** Parse pagination query params with sane defaults. */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
