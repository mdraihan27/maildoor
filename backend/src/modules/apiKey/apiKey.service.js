import crypto from 'node:crypto';
import ApiKeyRepository from './apiKey.repository.js';
import ApiKey from './apiKey.model.js';
import UserRepository from '../user/user.repository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import AuditService from '../audit/audit.service.js';

// ─── Key generation constants ───────────────────────────────────
const KEY_PREFIX = 'mk_live_';
const RAW_RANDOM_BYTES = 48; // 48 bytes → 96 hex chars; total with prefix ≈ 104 chars

class ApiKeyService {
  // ─── Create ─────────────────────────────────────────────────

  /**
   * Generate a new API key.
   *
   * Flow:
   *  1. Enforce per-user key limit
   *  2. Generate 64+ char cryptographically random key
   *  3. SHA-256 hash it
   *  4. Store hash + metadata
   *  5. Push ref into User.apiKeys
   *  6. Return plaintext key ONCE in the response
   *
   * @param {string} userId
   * @param {{ name: string, expiresAt?: string, allowedIPs?: string[] }} opts
   * @returns {object} Created key record + rawKey (plaintext, shown once)
   */
  async create(userId, { name, expiresAt = null, allowedIPs = [] }, req) {
    // 1. Enforce limit
    const activeCount = await ApiKeyRepository.countActiveByUser(userId);
    if (activeCount >= ApiKey.MAX_KEYS_PER_USER) {
      throw new BadRequestError(
        `Maximum of ${ApiKey.MAX_KEYS_PER_USER} active API keys per user`,
      );
    }

    // 2. Generate raw key (64+ chars)
    const rawRandom = crypto.randomBytes(RAW_RANDOM_BYTES).toString('hex');
    const rawKey = `${KEY_PREFIX}${rawRandom}`; // e.g. mk_live_<96 hex> ≈ 104 chars

    // 3. SHA-256 hash (deterministic, one-way)
    const hashedKey = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');

    // 4. Store
    const prefix = rawKey.substring(0, 8);  // "mk_live_"
    const suffix = rawKey.slice(-4);        // last 4 hex chars

    const record = await ApiKeyRepository.create({
      user: userId,
      name,
      hashedKey,
      prefix,
      suffix,
      expiresAt: expiresAt || null,
      allowedIPs,
    });

    // 5. Push ref into User.apiKeys
    await UserRepository.pushApiKey(userId, record._id);

    // 6. Audit
    AuditService.logFromRequest({
      actor: userId,
      action: 'APIKEY_CREATED',
      resource: 'ApiKey',
      resourceId: record._id,
      outcome: 'SUCCESS',
      meta: { name, prefix },
    }, req).catch(() => {});

    logger.info('API key created', { userId, keyId: record._id, name });

    // Return plaintext ONCE — never stored, never retrievable again
    return { ...record, key: rawKey };
  }

  // ─── List ───────────────────────────────────────────────────

  async listByUser(userId, pagination) {
    return ApiKeyRepository.listByUser(userId, pagination);
  }

  // ─── Revoke ─────────────────────────────────────────────────

  /**
   * Revoke a key (soft-disable). Ownership validated.
   */
  async revoke(userId, keyId, req) {
    const key = await this._findAndAuthorize(userId, keyId);

    if (key.status === ApiKey.STATUSES.REVOKED) {
      throw new BadRequestError('API key is already revoked');
    }

    const revoked = await ApiKeyRepository.revoke(keyId);

    AuditService.logFromRequest({
      actor: userId,
      action: 'APIKEY_REVOKED',
      resource: 'ApiKey',
      resourceId: keyId,
      outcome: 'SUCCESS',
      meta: { name: key.name },
    }, req).catch(() => {});

    logger.info('API key revoked', { userId, keyId });
    return revoked;
  }

  // ─── Delete ─────────────────────────────────────────────────

  /**
   * Permanently delete a key and remove its ref from User.apiKeys.
   */
  async remove(userId, keyId, req) {
    await this._findAndAuthorize(userId, keyId);

    await Promise.all([
      ApiKeyRepository.deleteById(keyId),
      UserRepository.pullApiKey(userId, keyId),
    ]);

    AuditService.logFromRequest({
      actor: userId,
      action: 'APIKEY_DELETED',
      resource: 'ApiKey',
      resourceId: keyId,
      outcome: 'SUCCESS',
    }, req).catch(() => {});

    logger.info('API key deleted', { userId, keyId });
  }

  // ─── Validate (used by middleware) ──────────────────────────

  /**
   * Validate a raw API key from a request.
   * Uses constant-time comparison on the SHA-256 hash.
   *
   * @param {string} rawKey   Plaintext key from the x-api-key header
   * @param {string} [clientIP]  Requesting IP for allowlist check
   * @returns {{ apiKey, user }}  Hydrated key + owner
   */
  async validateKey(rawKey, clientIP = null) {
    // Hash the incoming key
    const incomingHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');

    // Look up stored record by hash
    const apiKey = await ApiKeyRepository.findByHash(incomingHash);
    if (!apiKey) return null;

    // Constant-time comparison to prevent timing attacks
    const storedBuf = Buffer.from(apiKey.hashedKey, 'hex');
    const incomingBuf = Buffer.from(incomingHash, 'hex');
    if (
      storedBuf.length !== incomingBuf.length ||
      !crypto.timingSafeEqual(storedBuf, incomingBuf)
    ) {
      return null;
    }

    // Status check
    if (apiKey.status !== ApiKey.STATUSES.ACTIVE) return null;

    // Expiry check
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // IP allowlist check
    if (apiKey.allowedIPs?.length > 0 && clientIP) {
      if (!apiKey.allowedIPs.includes(clientIP)) return null;
    }

    // Hydrate the owning user
    const user = await UserRepository.findById(apiKey.user);
    if (!user || user.status !== 'ACTIVE') return null;

    // Non-blocking last-used update
    ApiKeyRepository.touchLastUsed(apiKey._id).catch(() => {});

    return { apiKey, user };
  }

  // ─── Private helpers ────────────────────────────────────────

  /**
   * Find a key by ID and verify the requesting user owns it.
   * @private
   */
  async _findAndAuthorize(userId, keyId) {
    const key = await ApiKeyRepository.findById(keyId);
    if (!key) throw new NotFoundError('API Key');
    if (key.user.toString() !== userId.toString()) {
      throw new ForbiddenError('You do not own this API key');
    }
    return key;
  }
}

export default new ApiKeyService();
