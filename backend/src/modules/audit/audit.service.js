import AuditRepository from './audit.repository.js';
import AuditLog from './audit.model.js';
import logger from '../../utils/logger.js';

// ─── Headers to capture (safe subset — NO auth or cookie headers) ──
const SAFE_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'origin',
  'referer',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-request-id',
  'x-real-ip',
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-ch-ua-mobile',
];

// ─── Write buffer for high-throughput batching ──────────────────
const BUFFER_FLUSH_INTERVAL_MS = 2_000; // flush every 2 s
const BUFFER_MAX_SIZE = 50;             // or when buffer hits 50 entries

/**
 * AuditService — fire-and-forget, performance-first audit logger.
 *
 * Design principles:
 *  - NEVER throw — audit failures must not break core flows
 *  - Write-buffered: entries are queued and bulk-inserted periodically
 *  - Structured: every log uses a canonical ACTIONS enum from the model
 *  - Context-rich: extracts IP, UA, device, safe headers from Express req
 */
class AuditService {
  constructor() {
    /** @type {object[]} */
    this._buffer = [];
    this._flushTimer = null;
  }

  // ─── Public: write ──────────────────────────────────────────

  /**
   * Record an audit event.  Fire-and-forget.
   *
   * @param {object} opts
   * @param {string}  opts.action       Canonical action from AuditLog.ACTIONS
   * @param {string} [opts.actor]       User ObjectId (null for system events)
   * @param {string} [opts.resource]    Resource type name
   * @param {*}      [opts.resourceId]  Resource instance ID
   * @param {string} [opts.severity]    INFO | WARN | ERROR (default INFO)
   * @param {string} [opts.outcome]     SUCCESS | FAILURE | null
   * @param {string} [opts.errorMessage]
   * @param {number} [opts.durationMs]
   * @param {object} [opts.meta]        Action-specific metadata
   * @param {string} [opts.ip]
   * @param {string} [opts.userAgent]
   * @param {string} [opts.deviceInfo]
   * @param {object} [opts.headers]     Pre-filtered safe headers
   * @param {string} [opts.requestId]   X-Request-Id correlation
   * @returns {Promise<void>}
   */
  async log(opts) {
    try {
      const entry = {
        action: opts.action,
        actor: opts.actor || null,
        resource: opts.resource || null,
        resourceId: opts.resourceId || null,
        severity: opts.severity || AuditLog.SEVERITIES.INFO,
        outcome: opts.outcome || null,
        errorMessage: opts.errorMessage || null,
        durationMs: opts.durationMs ?? null,
        meta: opts.meta || null,
        ip: opts.ip || null,
        userAgent: opts.userAgent || null,
        deviceInfo: opts.deviceInfo || null,
        headers: opts.headers || null,
        requestId: opts.requestId || null,
      };

      this._buffer.push(entry);
      this._scheduleFlush();
    } catch (err) {
      logger.error('Audit log enqueue failed', { error: err.message, action: opts.action });
    }
  }

  /**
   * Convenience: log an event and automatically extract request context
   * from an Express `req` object.
   *
   * @param {object}  opts        Same as `log()` minus IP/UA/headers/requestId
   * @param {object}  req         Express request
   * @returns {Promise<void>}
   */
  async logFromRequest(opts, req) {
    const ctx = AuditService.extractRequestContext(req);
    return this.log({ ...ctx, ...opts });
  }

  // ─── Public: read ───────────────────────────────────────────

  async listByActor(actorId, pagination) {
    return AuditRepository.findByActor(actorId, pagination);
  }

  async listByCategory(category, pagination) {
    return AuditRepository.findByCategory(category, pagination);
  }

  async listByAction(action, pagination) {
    return AuditRepository.findByAction(action, pagination);
  }

  async listByIP(ip, pagination) {
    return AuditRepository.findByIP(ip, pagination);
  }

  async list(filter, pagination) {
    return AuditRepository.list({ filter, ...pagination });
  }

  async findByRequestId(requestId) {
    return AuditRepository.findByRequestId(requestId);
  }

  // ─── Static helpers ─────────────────────────────────────────

  /**
   * Extract a standardised request-context object from an Express req.
   * Reusable across middlewares, services, and controllers.
   *
   * @param {object} req
   * @returns {{ ip, userAgent, deviceInfo, headers, requestId }}
   */
  static extractRequestContext(req) {
    if (!req) return {};

    const ip =
      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;

    const userAgent = req.headers?.['user-agent'] || null;

    // Parsed device string (if ua-parser-js was used upstream)
    const deviceInfo = req.deviceInfo || null;

    // Filter headers to safe subset
    const headers = req.headers
      ? AuditService._pickSafeHeaders(req.headers)
      : null;

    const requestId =
      req.headers?.['x-request-id'] || req.id || null;

    return { ip, userAgent, deviceInfo, headers, requestId };
  }

  // ─── Buffer management (private) ────────────────────────────

  /** Schedule a flush if one isn't already pending. */
  _scheduleFlush() {
    if (this._buffer.length >= BUFFER_MAX_SIZE) {
      // Buffer full — flush immediately
      this._flush();
      return;
    }

    if (!this._flushTimer) {
      this._flushTimer = setTimeout(() => this._flush(), BUFFER_FLUSH_INTERVAL_MS);
    }
  }

  /** Drain the buffer and bulk-insert into MongoDB. */
  async _flush() {
    // Clear the timer before draining
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    if (this._buffer.length === 0) return;

    // Atomically swap in a fresh buffer so new writes don't block
    const batch = this._buffer;
    this._buffer = [];

    try {
      if (batch.length === 1) {
        await AuditRepository.create(batch[0]);
      } else {
        await AuditRepository.insertMany(batch);
      }
    } catch (err) {
      // Last-resort: log to Winston so entries aren't silently lost
      logger.error('Audit bulk-write failed', {
        error: err.message,
        droppedCount: batch.length,
        actions: batch.map((e) => e.action),
      });
    }
  }

  /**
   * Graceful shutdown — flush any remaining buffered entries.
   * Call this from your process signal handler.
   */
  async shutdown() {
    await this._flush();
  }

  // ─── Private helpers ────────────────────────────────────────

  /**
   * Pick only the pre-approved safe headers.
   * @param {object} rawHeaders
   * @returns {object|null}
   */
  static _pickSafeHeaders(rawHeaders) {
    const picked = {};
    let count = 0;
    for (const key of SAFE_HEADERS) {
      if (rawHeaders[key]) {
        picked[key] = rawHeaders[key];
        count++;
      }
    }
    return count > 0 ? picked : null;
  }
}

export default new AuditService();
