import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDirectory = path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.metadata(), // Include metadata
    winston.format.printf(({ timestamp, level, message, metadata }) => {
      const { correlationId, methodName, fileName } = metadata;
      return JSON.stringify({
        timestamp,
        level,
        message,
        correlationId,
        methodName,
        fileName,
      });
    }),
  ),
  transports: [
    // Log to console during development
    new winston.transports.Console(),
    // Log to daily rotating files
    new DailyRotateFile({
      filename: path.join(logDirectory, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Max size of each log file
      maxFiles: '14d', // Keep logs for 14 days
    }),
  ],
});

export default logger;
