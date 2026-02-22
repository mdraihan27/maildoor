import { HttpStatus } from '../config/httpStatus.js';

/**
 * Standardised JSON response envelope.
 *
 * Success : { success: true, data, meta? }
 * Error   : { success: false, error: { code, message, details? } }
 */

export const success = (res, data = null, statusCode = HttpStatus.OK, meta = null) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const created = (res, data = null) =>
  success(res, data, HttpStatus.CREATED);

export const noContent = (res) =>
  res.status(HttpStatus.NO_CONTENT).end();

export const error = (res, statusCode, code, message, details = null) => {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
};

export const paginated = (res, data, page, limit, total) =>
  success(res, data, HttpStatus.OK, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
