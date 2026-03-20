import { Events, InteractionType } from 'discord.js';
import { config } from '@/config';
import { applicationCommandHandler } from '@/events/interactionCreate.applicationCommand';
import { defineEvent } from '@/utils/define';

const handlers: Partial<Record<InteractionType, CallableFunction>> = {
  [InteractionType.ApplicationCommand]: applicationCommandHandler
};

export default defineEvent({
  name: Events.InteractionCreate,
  run: async (client, interaction) => {
    const handler = handlers[interaction.type];
    if (!handler) return;

    const isLanguageSupported = Object.keys(config.bot.supportedLanguages).includes(interaction.locale);
    interaction.language = isLanguageSupported ? interaction.locale : config.bot.defaultLanguage;

    return handler(client, interaction);
  }
});
