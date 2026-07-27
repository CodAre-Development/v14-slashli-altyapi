import type { ChatInputCommandInteraction, Client, PermissionResolvable } from 'discord.js';
import { commands } from '@/loaders/command';
import { config } from '@/shared/config';
import { logger } from '@/shared/logger';

export async function applicationCommandHandler(client: Client<true>, interaction: ChatInputCommandInteraction) {
  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;

  const isSupportServer = interaction.guildId === config.guilds.support.id;
  const isTestServer = interaction.guildId === config.guilds.test.id;
  const isAdmin = config.bot.admins.has(interaction.user.id);

  if (cmd.config.botAdminsOnly && !isAdmin) {
    return interaction.error(interaction.t('commandErrors.botAdminsOnly'));
  }

  if (cmd.config.disabled) {
    return interaction.error(interaction.t('commandErrors.disabled'));
  }

  if (cmd.config.dmOnly && interaction.inGuild()) {
    return interaction.error(interaction.t('commandErrors.dmOnly'));
  }

  if (cmd.config.guildOnly && !interaction.inGuild()) {
    return interaction.error(interaction.t('commandErrors.guildOnly'));
  }

  if (cmd.config.supportServerOnly && !isSupportServer && !isTestServer) {
    return interaction.error(
      interaction.t('commandErrors.supportServerOnly', { invite: config.guilds.support.invite })
    );
  }

  if ((cmd.config.memberPermissions?.length || cmd.config.botPermissions?.length) && interaction.inGuild()) {
    const missingMember = interaction.memberPermissions.missing(cmd.config.memberPermissions ?? []);
    if (missingMember?.length) {
      return interaction.error(
        interaction.t('commandErrors.memberMissingPermissions', {
          permissions: formatPermissions(interaction, missingMember)
        })
      );
    }

    const missingBot = interaction.appPermissions.missing(cmd.config.botPermissions ?? []);
    if (missingBot?.length) {
      return interaction.error(
        interaction.t('commandErrors.botMissingPermissions', {
          permissions: formatPermissions(interaction, missingBot)
        })
      );
    }
  }

  try {
    await cmd.run({ client, interaction });
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, 'Command execution failed');
    await interaction.error(interaction.t('commandErrors.unexpectedError'));
  }
}

function formatPermissions(interaction: ChatInputCommandInteraction, missing: PermissionResolvable[]) {
  const names: Record<string, string> = interaction.t('permissions', { returnObjects: true });
  return missing.map((p) => `\`${names[p.toString()] || p.toString()}\``).join(', ');
}
