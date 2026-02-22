import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';

import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler, requestId } from './middlewares/index.js';
import { mongoSanitizeMiddleware, xssSanitizeMiddleware } from './middlewares/sanitize.js';

// ─── Route imports ──────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import apiKeyRoutes from './modules/apiKey/apiKey.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// ─── Trust proxy (for accurate req.ip behind reverse proxy) ─────
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────
// SECURITY LAYER
// ─────────────────────────────────────────────────────────────────

// 1. Helmet — sets security headers (CSP, HSTS, X-Frame, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // relax for API-only servers
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

// 2. CORS — explicit origin / method / header allowlist
app.use(cors(config.cors));

// 3. Global per-IP rate limiter
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'ERR_RATE_LIMIT', message: 'Too many requests' },
    },
  }),
);

// ─────────────────────────────────────────────────────────────────
// PARSING & SANITISATION
// ─────────────────────────────────────────────────────────────────

// 4. Body parsing with strict size limits
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(cookieParser());

// 5. HTTP Parameter Pollution protection
app.use(hpp());

// 6. NoSQL injection prevention (strip $ / . from input)
app.use(mongoSanitizeMiddleware);

// 7. XSS / null-byte sanitisation
app.use(xssSanitizeMiddleware);

// ─────────────────────────────────────────────────────────────────
// OBSERVABILITY
// ─────────────────────────────────────────────────────────────────

// 8. Request ID tracing
app.use(requestId);

// 9. HTTP access logs
const morganStream = { write: (msg) => logger.http(msg.trim()) };
app.use(
  morgan(config.env === 'production' ? 'combined' : 'dev', { stream: morganStream }),
);

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────
// AUTH RATE LIMITER (scoped to auth endpoints only)
// ─────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'ERR_RATE_LIMIT', message: 'Too many auth attempts' },
  },
});

// ─────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/audit', auditRoutes);

// ─────────────────────────────────────────────────────────────────
// FALLBACK & ERROR HANDLING
// ─────────────────────────────────────────────────────────────────

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'ERR_NOT_FOUND', message: 'Route not found' },
  });
});

// Central error handler (must be last)
app.use(errorHandler);

export default app;
