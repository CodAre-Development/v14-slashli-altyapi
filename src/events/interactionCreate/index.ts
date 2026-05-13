import { Events, InteractionType } from 'discord.js';
import { applicationCommandHandler } from '@/events/interactionCreate/applicationCommand';
import { config } from '@/shared/config';
import { defineEvent } from '@/utils/define';

const handlers: Partial<Record<InteractionType, CallableFunction>> = {
  [InteractionType.ApplicationCommand]: applicationCommandHandler
};

export default defineEvent({
  name: Events.InteractionCreate,
  run: async (client, interaction) => {
    const handler = handlers[interaction.type];
    if (!handler) return;

    const isLangSupported = interaction.locale in config.bot.supportedLanguages;
    interaction.language = isLangSupported ? interaction.locale : config.bot.defaultLanguage;

    return handler(client, interaction);
  }
});
