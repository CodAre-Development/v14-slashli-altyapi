import { Locale, resolveColor } from 'discord.js';
import type { Level } from 'pino';
import * as v from 'valibot';
import { logger } from '@/shared/logger';

// Empty env vars (like `BOT_TOKEN=`) are empty strings not undefined meaning v.optional()'s
// fallback won't trigger unless we convert empty strings to undefined first
const emptyToUndefined = v.pipe(
  v.string(),
  v.transform((value) => value.trim() || undefined)
);

const snowflake = v.pipe(v.string(), v.trim(), v.regex(/^\d{17,20}$/, 'Must be a valid Discord ID'));
const optionalSnowflake = v.optional(v.pipe(emptyToUndefined, v.optional(snowflake)));
const nonEmptyString = v.pipe(v.string(), v.trim(), v.minLength(1, 'Must not be empty'));
const optionalUrl = v.optional(
  v.pipe(emptyToUndefined, v.optional(v.pipe(v.string(), v.trim(), v.url('Must be a valid URL'))))
);

const arrayFromString = <TItem>(itemSchema: v.GenericSchema<string, TItem>) =>
  v.pipe(
    v.optional(v.string(), ''),
    v.transform((value) =>
      value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    ),
    v.array(itemSchema)
  );

const enumVal = <const T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) => {
  return v.pipe(emptyToUndefined, v.optional(v.picklist(values), fallback));
};

const envSchema = v.object({
  NODE_ENV: enumVal(['development', 'production'], 'development'),
  BOT_TOKEN: nonEmptyString,
  LOG_LEVEL: enumVal(['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const satisfies Level[], 'info'),
  BOT_ADMINS: arrayFromString(snowflake),
  SUPPORT_SERVER_ID: optionalSnowflake,
  SUPPORT_SERVER_INVITE: optionalUrl,
  DEV_GUILD_ID: optionalSnowflake
});

const parsed = v.safeParse(envSchema, process.env);
if (!parsed.success) {
  const flat = v.flatten<typeof envSchema>(parsed.issues);
  logger.fatal({ errors: flat.nested ?? {} }, 'Invalid environment variables');
  process.exit(1);
}

logger.level = parsed.output.LOG_LEVEL;

export const config = {
  env: parsed.output.NODE_ENV,
  bot: {
    token: parsed.output.BOT_TOKEN,
    admins: new Set(parsed.output.BOT_ADMINS),
    // These values must match the folder names under locales
    languages: {
      [Locale.EnglishUS]: 'en',
      [Locale.EnglishGB]: 'en',
      [Locale.Turkish]: 'tr'
    },
    defaultLanguage: Locale.EnglishUS
  },
  guilds: {
    dev: {
      id: parsed.output.DEV_GUILD_ID
    },
    support: {
      id: parsed.output.SUPPORT_SERVER_ID,
      invite: parsed.output.SUPPORT_SERVER_INVITE
    }
  },
  embedColors: {
    default: resolveColor('#5865F2'),
    error: resolveColor('#F04A47'),
    success: resolveColor('#56B849')
  }
} as const;
