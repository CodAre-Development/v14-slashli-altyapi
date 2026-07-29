import type { AutocompleteInteraction } from 'discord.js';
import i18next from 'i18next';
import { checkAccess } from '@/events/interaction-create';
import { commands } from '@/loaders/command';
import { logger } from '@/shared/logger';
import { resolveLanguage } from '@/utils/language';

export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const cmd = commands.get(interaction.commandName);
  if (!cmd?.autocomplete) return interaction.respond([]);

  const result = checkAccess(cmd, interaction);
  if (!result.ok) return interaction.respond([]);

  try {
    await cmd.autocomplete({ interaction, t: i18next.getFixedT(resolveLanguage(interaction.locale)) });
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, 'Autocomplete failed');
    await interaction.respond([]);
  }
}
