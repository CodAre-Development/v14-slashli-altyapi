import type { Level } from 'pino';
import { z } from 'zod';
import { logger } from '@/utils/logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as Level[]).default('info'),
  BOT_TOKEN: z.string().min(1)
});

export let env: z.infer<typeof envSchema>;

export function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.fatal({ errors: z.treeifyError(result.error).properties }, 'Invalid environment variables');
    process.exit(1);
  }

  env = result.data;
}
