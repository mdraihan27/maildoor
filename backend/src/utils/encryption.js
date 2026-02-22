import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 16;
const ENCODING = 'hex';
const SEPARATOR = ':';

/**
 * Derive a deterministic 32-byte key from any-length secret.
 * @param {string} secret
 * @returns {Buffer}
 */
const deriveKey = (secret) =>
  crypto.createHash('sha256').update(secret).digest();

/**
 * AES-256-GCM encrypt.
 * Output format: `iv:authTag:ciphertext` (all hex-encoded).
 *
 * @param {string} plaintext
 * @param {string} secret  Encryption key material (e.g. JWT_SECRET)
 * @returns {string}
 */
export const encrypt = (plaintext, secret) => {
  if (!plaintext || !secret) {
    throw new Error('encrypt() requires both plaintext and secret');
  }

  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);
  const authTag = cipher.getAuthTag().toString(ENCODING);

  return [iv.toString(ENCODING), authTag, encrypted].join(SEPARATOR);
};

/**
 * AES-256-GCM decrypt.
 * Expects the `iv:authTag:ciphertext` format produced by `encrypt()`.
 *
 * @param {string} payload  Encrypted string
 * @param {string} secret   Same secret used for encryption
 * @returns {string}
 * @throws {Error} On tampered / malformed data
 */
export const decrypt = (payload, secret) => {
  if (!payload || !secret) {
    throw new Error('decrypt() requires both payload and secret');
  }

  const parts = payload.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload');
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const key = deriveKey(secret);
  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Check whether a string looks like an already-encrypted payload.
 * @param {string} value
 * @returns {boolean}
 */
export const isEncrypted = (value) => {
  if (typeof value !== 'string') return false;
  const parts = value.split(SEPARATOR);
  // iv(32 hex) : authTag(32 hex) : ciphertext(variable hex)
  return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
};
