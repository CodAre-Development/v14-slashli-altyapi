import { client } from '@/loaders/client';
import { env, parseEnv } from '@/utils/env';
import { logger } from '@/utils/logger';

parseEnv();
logger.level = env.LOG_LEVEL;

process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled Rejection'));
process.on('uncaughtException', (err) => logger.error({ err }, 'Uncaught Exception'));

client.start();
