import cron from 'node-cron';
import logger from '../utils/logger.js';

/** Registry of all scheduled jobs. */
const jobs = [];

/**
 * Register a cron job.
 * @param {string} name       Human-readable name
 * @param {string} schedule   Cron expression (e.g. '0 * * * *' = every hour)
 * @param {Function} handler  Async function to execute
 */
export const registerJob = (name, schedule, handler) => {
  if (!cron.validate(schedule)) {
    logger.error(`Invalid cron expression for job "${name}": ${schedule}`);
    return;
  }

  const task = cron.schedule(schedule, async () => {
    const start = Date.now();
    logger.info(`Job "${name}" started`);
    try {
      await handler();
      logger.info(`Job "${name}" completed`, { durationMs: Date.now() - start });
    } catch (err) {
      logger.error(`Job "${name}" failed`, { error: err.message, durationMs: Date.now() - start });
    }
  });

  jobs.push({ name, schedule, task });
  logger.info(`Registered cron job "${name}" [${schedule}]`);
};

/**
 * Gracefully stop all scheduled jobs.
 */
export const stopAllJobs = () => {
  jobs.forEach(({ name, task }) => {
    task.stop();
    logger.info(`Stopped job "${name}"`);
  });
};
