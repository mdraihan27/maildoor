import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/** Establish MongoDB connection with retry logic. */
const connectDatabase = async () => {
  const { uri, options } = config.mongo;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    logger.error('Initial MongoDB connection failed', { error: err.message });
    process.exit(1);
  }
};

/** Graceful shutdown helper. */
export const disconnectDatabase = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed gracefully');
};

export default connectDatabase;
