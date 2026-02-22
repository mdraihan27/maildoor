import { sanitize as mongoSanitizeFn } from 'express-mongo-sanitize';

/**
 * Input sanitisation middleware.
 *
 * 1. Mongo injection prevention — strips `$` and `.` operators from
 *    req.body, req.query, req.params to prevent NoSQL injection.
 * 2. XSS-light — strips null bytes and common script vectors from
 *    string values (belt-and-suspenders; Helmet CSP is the real guard).
 *
 * Usage: app.use(sanitize)   (after body-parser, before routes)
 *
 * NOTE: express-mongo-sanitize's default middleware reassigns req.query
 * and req.params which throws in Express 5 (getter-only).  We call its
 * `.sanitize()` helper directly so values are mutated **in place**.
 */

// ─── Mongo-sanitize (strips $ / . operators) ───────────────────
export const mongoSanitizeMiddleware = (req, _res, next) => {
  const opts = { replaceWith: '_', allowDots: false };
  if (req.body)   mongoSanitizeFn(req.body, opts);
  if (req.query)  mongoSanitizeFn(req.query, opts);
  if (req.params) mongoSanitizeFn(req.params, opts);
  next();
};

// ─── Null-byte / script-tag stripper ────────────────────────────

const DANGEROUS_PATTERNS = [
  /\0/g,                            // null bytes
  /<script[\s>]/gi,                 // opening script tags
  /javascript\s*:/gi,              // javascript: URIs
  /on\w+\s*=\s*["']/gi,           // inline event handlers (onerror=, onclick=)
];

/**
 * Recursively sanitise string values in an object.
 * Mutates in place for performance (called on req.body / req.query).
 */
const deepSanitize = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    let clean = obj;
    for (const pattern of DANGEROUS_PATTERNS) {
      clean = clean.replace(pattern, '');
    }
    return clean;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = deepSanitize(obj[i]);
    }
    return obj;
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      obj[key] = deepSanitize(obj[key]);
    }
    return obj;
  }

  return obj;
};

/**
 * Sanitise values of an object's own keys **in place** (no reassignment).
 * Needed because Express / Node may define req.query and req.params as
 * getter-only properties that cannot be overwritten with `=`.
 */
const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    obj[key] = deepSanitize(obj[key]);
  }
};

/**
 * Express middleware: sanitise body, query, and params.
 */
export const xssSanitizeMiddleware = (req, _res, next) => {
  if (req.body) req.body = deepSanitize(req.body);
  sanitizeInPlace(req.query);
  sanitizeInPlace(req.params);
  next();
};
