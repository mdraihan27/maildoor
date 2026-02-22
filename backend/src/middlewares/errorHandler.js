import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

const isProd = config.env === 'production';

/**
 * Central error-handling middleware.
 * Must be registered LAST in the middleware chain (4-arg signature).
 *
 * Handles:
 *  - Mongoose ValidationError
 *  - Mongoose CastError (bad ObjectId)
 *  - Mongoose duplicate key (code 11000)
 *  - JWT errors
 *  - SyntaxError from body-parser (malformed JSON)
 *  - express-rate-limit 429
 *  - Payload too large (413)
 *  - Known AppError subclasses
 *  - Unknown / programmer errors (500)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // ─── Mongoose validation ─────────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      error: { code: 'ERR_VALIDATION', message: 'Validation failed', details },
    });
  }

  // ─── Mongoose CastError (e.g. invalid ObjectId) ──────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ERR_BAD_REQUEST',
        message: `Invalid ${err.kind}: ${err.value}`,
      },
    });
  }

  // ─── Mongoose duplicate key ──────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      success: false,
      error: { code: 'ERR_CONFLICT', message: `Duplicate value for field: ${field}` },
    });
  }

  // ─── JWT errors ──────────────────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'ERR_UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }

  // ─── Malformed JSON body ─────────────────────────────────
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({
      success: false,
      error: { code: 'ERR_BAD_REQUEST', message: 'Malformed JSON in request body' },
    });
  }

  // ─── Payload too large ───────────────────────────────────
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'ERR_PAYLOAD_TOO_LARGE', message: 'Request body exceeds size limit' },
    });
  }

  // ─── Known operational errors (AppError subclasses) ──────
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // ─── Unknown / programmer errors ─────────────────────────
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req?.originalUrl,
    method: req?.method,
    ip: req?.ip,
    requestId: req?.id,
    ...(!isProd && { raw: err }),
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'ERR_INTERNAL',
      message: isProd ? 'Internal server error' : err.message,
    },
  });
};

export default errorHandler;
