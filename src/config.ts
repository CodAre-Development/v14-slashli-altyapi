import { ActivityType, Locale, type PresenceData, resolveColor } from 'discord.js';

export const config = Object.freeze({
  bot: {
    admins: [] as string[],
    // The values of this must match the language codes of the JSON files in the localizations folder
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
        type: ActivityType.Custom,
        name: 'Hi',
        state: 'Hi'
      }
    ],
    status: 'online'
  } satisfies PresenceData,
  guilds: {
    test: {
      id: '',
      invite: ''
    },
    supportServer: {
      id: '',
      invite: ''
    }
  },
  embedColors: {
    default: resolveColor('#5865F2'),
    error: resolveColor('#F04A47'),
    success: resolveColor('#56B849')
  }
});
