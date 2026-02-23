import rateLimit from 'express-rate-limit';

/**
 * Rate-limiter scoped to API key.
 *
 * Applied AFTER `authenticateApiKey` so `req.apiKey` is populated.
 * Limits are per-key (not per-IP) — prevents a single key from
 * monopolising the system even if distributed across IPs.
 *
 * Defaults: 200 requests per 15-minute window.
 *
 * @param {object} [opts]
 * @param {number} [opts.windowMs]  Window in ms (default 15 min)
 * @param {number} [opts.max]       Max requests per key per window (default 200)
 * @returns Express middleware
 */
const apiKeyRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 200,
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    // Key = API key ID (falls back to IP for safety)
    keyGenerator: (req) =>
      req.apiKey?._id?.toString() || req.ip,

    // Primary key is the API key ID, not IP — disable IPv6 fallback warning
    validate: { keyGeneratorIpFallback: false },

    message: {
      success: false,
      error: {
        code: 'ERR_RATE_LIMIT',
        message: 'API key rate limit exceeded — try again later',
      },
    },

    // Do NOT count failed / non-2xx responses against the quota
    skipFailedRequests: true,
  });

export default apiKeyRateLimiter;
