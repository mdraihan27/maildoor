import { registerJob } from './scheduler.js';
import logger from '../utils/logger.js';

/**
 * Initialise all application cron jobs.
 * Add new job registrations here.
 */
const initJobs = () => {
  // Example: health-check ping every 5 minutes
  registerJob('heartbeat', '*/5 * * * *', async () => {
    logger.debug('Heartbeat tick');
  });

  // Add more jobs as needed:
  // registerJob('cleanExpiredKeys', '0 3 * * *', cleanExpiredApiKeys);
  // registerJob('dailyDigest', '0 8 * * *', sendDailyDigest);
};

export default initJobs;
