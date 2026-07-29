import type { ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { checkAccess } from '@/events/interaction-create';
import { commands } from '@/loaders/command';
import { logger } from '@/shared/logger';
import { resolveLanguage } from '@/utils/language';
import { sendError } from '@/utils/send-embed';

export async function handleApplicationCommand(interaction: ChatInputCommandInteraction) {
  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;

  const result = checkAccess(cmd, interaction);
  if (!result.ok) {
    return sendError(interaction, result.error);
  }

  const t = i18next.getFixedT(resolveLanguage(interaction.locale));

  try {
    await cmd.run({ interaction, t });
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, 'Command execution failed');
    await sendError(interaction, t('generic', { ns: 'errors' }));
  }
}
