import pino from 'pino';

export const logger = pino(
  process.env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            ignore: 'pid,hostname',
            translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
            colorize: true
          }
        }
      }
    : {}
);
