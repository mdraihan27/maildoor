import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'MONGO_URI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,

  mongo: {
    uri: process.env.MONGO_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
    exposedHeaders: ['x-request-id', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // preflight cache 24 h
  },

  rateLimit: {
    /** Global per-IP rate limit. */
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

    /** Stricter limit for auth endpoints (login, token refresh). */
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,

    /** Per-API-key limit. */
    apiKeyWindowMs: parseInt(process.env.APIKEY_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    apiKeyMax: parseInt(process.env.APIKEY_RATE_LIMIT_MAX, 10) || 200,
  },

  cookie: {
    secure: (process.env.NODE_ENV || 'development') === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@maildoor.io',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  app: {
    name: process.env.APP_NAME || 'Maildoor',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});

export default config;
