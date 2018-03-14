import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    // write to all logs with level `info` and below to `combined.log`
    // write all logs error and below to `error.log`.
    new winston.transports.File({ filename: 'error.log', level: 'error', 'timestamp': true }),
    new winston.transports.File({ filename: 'combined.log', level: 'combined.log', 'timestamp': true })
  ]
});

if (process.env.NODE_ENV !== 'production' || process.env.NODE_ENV !== 'test') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    'timestamp': true
  }));
}

export default logger;