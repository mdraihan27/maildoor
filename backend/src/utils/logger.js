import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const logger = winston.createLogger({
  level: config.log.level,
  defaultMeta: { service: config.app.name },
  format: config.env === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
});

export default logger;
