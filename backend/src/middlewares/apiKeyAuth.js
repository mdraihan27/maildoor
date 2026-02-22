import { UnauthorizedError } from '../utils/errors.js';
import ApiKeyService from '../modules/apiKey/apiKey.service.js';
import AuditService from '../modules/audit/audit.service.js';

/**
 * Authenticate an incoming request via the `x-api-key` header.
 *
 * Delegates all hashing, constant-time comparison, status/expiry/IP checks,
 * and user hydration to ApiKeyService.validateKey().
 *
 * On success, fires a non-blocking APIKEY_USED audit event.
 *
 * Populates:
 *   req.user   – hydrated user document (lean)
 *   req.apiKey – matched API key document (lean)
 */
const authenticateApiKey = async (req, _res, next) => {
  try {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey) {
      throw new UnauthorizedError('Missing x-api-key header');
    }

    const clientIP =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;

    const result = await ApiKeyService.validateKey(rawKey, clientIP);

    if (!result) {
      throw new UnauthorizedError('Invalid, revoked, or expired API key');
    }

    req.user = result.user;
    req.apiKey = result.apiKey;

    // Fire-and-forget: audit every API key usage
    AuditService.logFromRequest(
      {
        action: 'APIKEY_USED',
        actor: result.user._id,
        resource: 'ApiKey',
        resourceId: result.apiKey._id,
        outcome: 'SUCCESS',
        meta: {
          keyPrefix: result.apiKey.prefix,
          method: req.method,
          path: req.originalUrl,
        },
      },
      req,
    ).catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticateApiKey;
