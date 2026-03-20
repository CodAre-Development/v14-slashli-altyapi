import { loadCommands } from '@/loaders/command';
import { env, parseEnv } from '@/utils/env';
import { logger } from '@/utils/logger';

parseEnv();
logger.level = env.LOG_LEVEL;

loadCommands(true);
