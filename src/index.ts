import { ActivityType, Client, Events, GatewayIntentBits, PresenceUpdateStatus } from 'discord.js';
import i18next from 'i18next';
import { loadCommands } from '@/loaders/command';
import { loadEvents } from '@/loaders/event';
import { config } from '@/shared/config';
import { logger } from '@/shared/logger';

function handleError(msg: string) {
  return (err: unknown) => logger.error({ err: err instanceof Error ? err : String(err) }, msg);
}

process.on('unhandledRejection', handleError('Unhandled rejection'));
process.on('uncaughtException', handleError('Uncaught exception'));
process.on('warning', (err) => logger.warn({ err }));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  presence: {
    activities: [
      {
        type: ActivityType.Custom,
        name: 'Hello',
        state: 'Hello'
      }
    ],
    status: PresenceUpdateStatus.Online
  }
});

await setupI18n();

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
  const namespaces = ['common', 'commands', 'errors'];
  await i18next.init({
    fallbackLng: config.bot.defaultLanguage,
    lng: config.bot.defaultLanguage,
    defaultNS: 'commands',
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}'
    }
  });

  await Promise.all(
    Object.entries(config.bot.languages).map(([key, value]) =>
      namespaces.map(async (ns) => {
        const { default: resource } = await import(`@/locales/${value}/${ns}.json`, {
          with: { type: 'json' }
        });

        i18next.addResourceBundle(key, ns, resource);
      })
    )
  );
}
