import { HttpStatus } from '../config/httpStatus.js';

/**
 * Operational error base class.
 * All known/expected errors should extend this.
 */
export class AppError extends Error {
  /**
   * @param {string} message  Human-readable message
   * @param {number} statusCode  HTTP status code
   * @param {object} [options]
   * @param {string} [options.code]  Machine-readable error code
   * @param {boolean} [options.isOperational]  Flag for operational vs programmer error
   * @param {object} [options.details]  Additional context
   */
  constructor(message, statusCode = HttpStatus.INTERNAL, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = options.code || 'ERR_UNKNOWN';
    this.isOperational = options.isOperational ?? true;
    this.details = options.details || null;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, HttpStatus.BAD_REQUEST, { code: 'ERR_BAD_REQUEST', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, { code: 'ERR_UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, { code: 'ERR_FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, { code: 'ERR_NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT, { code: 'ERR_CONFLICT' });
  }
}

export class ValidationError extends AppError {
  constructor(errors = []) {
    super('Validation failed', HttpStatus.UNPROCESSABLE, {
      code: 'ERR_VALIDATION',
      details: errors,
    });
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', HttpStatus.TOO_MANY_REQUESTS, { code: 'ERR_RATE_LIMIT' });
  }
}
