import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const createLogger = () => {
  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'f8-slackbot' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

// Extend winston logger with success method
declare module 'winston' {
  interface Logger {
    success(message: string, meta?: any): void;
  }
}

// Add success method to logger
const logger = createLogger();
logger.success = (message: string, meta?: any) => {
  logger.info(`✅ ${message}`, meta);
};