import { ActivityType, BaseInteraction, Client, Events, GatewayIntentBits, PresenceUpdateStatus } from 'discord.js';
import type { TFunction, TOptions } from 'i18next';
import i18next from 'i18next';
import { loadCommands } from '@/loaders/command';
import { loadEvents } from '@/loaders/event';
import { config } from '@/shared/config';
import { logger } from '@/shared/logger';
import { type SendEmbedOptions, sendEmbed } from '@/utils/sendEmbed';

function handleError(msg: string) {
  return (err: unknown) => logger.error({ err: err instanceof Error ? err : String(err) }, msg);
}

process.on('unhandledRejection', handleError('Unhandled Rejection'));
process.on('uncaughtException', handleError('Uncaught Exception'));
process.on('warning', (err) => logger.warn({ err }));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  presence: {
    activities: [
      {
        type: ActivityType.Custom,
        name: 'not visible',
        state: 'Hello'
      }
    ],
    status: PresenceUpdateStatus.Online
  }
});

await setupI18n();
extendBaseInteraction();

client.once(Events.ClientReady, async (client) => {
  logger.info({ tag: client.user.tag }, 'Logged in');

  try {
    await loadCommands();
    await loadEvents(client);
  } catch (err) {
    logger.fatal({ err }, 'Failed to initialize bot');
    process.exit(1);
  }
});

await client.login(config.bot.token).catch((err) => {
  logger.fatal({ err }, 'Failed to login');
  process.exit(1);
});

async function setupI18n() {
  await i18next.init({
    fallbackLng: config.bot.defaultLanguage,
    lng: config.bot.defaultLanguage,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}'
    }
  });

  await Promise.all(
    Object.entries(config.bot.supportedLanguages).map(async ([key, value]) => {
      const { default: language } = await import(`@/localizations/${value}.json`, {
        with: { type: 'json' }
      });

      i18next.addResourceBundle(key, 'translation', language);
    })
  );
}

function extendBaseInteraction() {
  Object.defineProperties(BaseInteraction.prototype, {
    error: {
      value(optionsOrDesc: SendEmbedOptions | string) {
        if (typeof optionsOrDesc === 'string') {
          optionsOrDesc = { description: optionsOrDesc };
        }

        return sendEmbed(this, { ...optionsOrDesc, embedType: 'error' });
      }
    },
    success: {
      value(optionsOrDesc: SendEmbedOptions | string) {
        if (typeof optionsOrDesc === 'string') {
          optionsOrDesc = { description: optionsOrDesc };
        }

        return sendEmbed(this, { ...optionsOrDesc, embedType: 'success' });
      }
    },
    t: {
      value(...args: Parameters<TFunction>) {
        const options: TOptions = typeof args[1] === 'object' && args[1] != null ? args[1] : {};
        if (!options.lng) options.lng = this.language || this.locale;

        (args[1] as unknown as TOptions) = options;
        return i18next.t(...args);
      }
    }
  });
}
