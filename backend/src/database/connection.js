import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/** Cache the connection promise so concurrent requests don't open duplicates. */
let connectionPromise = null;

/** Establish MongoDB connection (with serverless-safe caching). */
const connectDatabase = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) return;

  // If a connection attempt is in progress, wait for it
  if (connectionPromise) return connectionPromise;

  const { uri, options } = config.mongo;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    connectionPromise = null; // allow reconnection on next request
  });

  try {
    connectionPromise = mongoose.connect(uri, options);
    await connectionPromise;
  } catch (err) {
    connectionPromise = null;
    logger.error('Initial MongoDB connection failed', { error: err.message });
    // In serverless, don't exit the process — throw so the request fails gracefully
    if (process.env.VERCEL) {
      throw err;
    }
    process.exit(1);
  }
};

/**
 * Express middleware that ensures the database is connected
 * before handling any request. Essential for serverless (Vercel).
 */
export const ensureDbConnected = async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
};

/** Graceful shutdown helper. */
export const disconnectDatabase = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed gracefully');
};

export default connectDatabase;
