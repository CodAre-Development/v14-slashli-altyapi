import { ActivityType, Locale, type PresenceData, resolveColor } from 'discord.js';
import type { Level } from 'pino';
import { z } from 'zod';
import { logger } from '@/shared/logger';

function emptyToUndefined(value: unknown) {
  return typeof value === 'string' && !value.trim() ? undefined : value;
}

function zEnum<const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) {
  return z.preprocess(emptyToUndefined, z.enum(values).default(fallback));
}

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const requiredString = z.preprocess(emptyToUndefined, z.string().min(1));

const envSchema = z.object({
  NODE_ENV: zEnum(['development', 'production'], 'development'),
  BOT_TOKEN: requiredString,
  LOG_LEVEL: zEnum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const satisfies readonly Level[], 'info'),
  BOT_ADMINS: optionalString,
  SUPPORT_SERVER_ID: optionalString,
  SUPPORT_SERVER_INVITE: optionalString,
  TEST_GUILD_ID: optionalString
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const tree = z.treeifyError(parsed.error).properties || {};
  const errors = Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, v.errors]));

  logger.fatal({ errors }, 'Invalid environment variables');
  process.exit(1);
}

logger.level = parsed.data.LOG_LEVEL;

export const config = {
  env: parsed.data.NODE_ENV,
  bot: {
    token: parsed.data.BOT_TOKEN,
    admins: parseList(parsed.data.BOT_ADMINS),
    // These values must match the language codes in the filenames of the files in the localizations folder
    supportedLanguages: {
      [Locale.EnglishUS]: 'en',
      [Locale.EnglishGB]: 'en',
      [Locale.Turkish]: 'tr'
    },
    defaultLanguage: Locale.EnglishUS
  },
  presence: {
    activities: [
      {
        type: ActivityType.Watching,
        name: 'your commands'
      }
    ],
    status: 'online'
  } satisfies PresenceData,
  guilds: {
    test: {
      id: parsed.data.TEST_GUILD_ID ?? ''
    },
    supportServer: {
      id: parsed.data.SUPPORT_SERVER_ID ?? '',
      invite: parsed.data.SUPPORT_SERVER_INVITE ?? ''
    }
  },
  embedColors: {
    default: resolveColor('#5865F2'),
    error: resolveColor('#F04A47'),
    success: resolveColor('#56B849')
  }
} as const;

function parseList(value?: string) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
