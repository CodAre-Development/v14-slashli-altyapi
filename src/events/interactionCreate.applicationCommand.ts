import type { ChatInputCommandInteraction } from 'discord.js';
import { config } from '@/config';
import { commands } from '@/loaders/command';
import type { Client, CommandData, CommandOptions } from '@/types';
import { logger } from '@/utils/logger';

export async function applicationCommandHandler(client: Client, interaction: ChatInputCommandInteraction) {
  const cmd = commands.find((x) => x.data.name === interaction.commandName);
  if (!cmd) return;

  const cfg = resolveConfig(cmd, interaction);
  const guildId = interaction.guildId;
  const isSupportServer = guildId === config.guilds.supportServer.id || guildId === config.guilds.test.id;
  const isAdmin = config.bot.admins.includes(interaction.user.id);

  if (cfg.botAdminsOnly && !isAdmin) return interaction.error(interaction.translate('commandErrors.botAdminsOnly'));
  if (cfg.disabled) return interaction.error(interaction.translate('commandErrors.disabled'));
  if (cfg.dmOnly && interaction.guild) return interaction.error(interaction.translate('commandErrors.dmOnly'));
  if (cfg.guildOnly && !interaction.guild) return interaction.error(interaction.translate('commandErrors.guildOnly'));
  if (cfg.supportServerOnly && !isSupportServer)
    return interaction.error(
      interaction.translate('commandErrors.supportServerOnly', { invite: config.guilds.supportServer.invite })
    );

  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(interaction.user.id);

    const missingMember = cfg.memberPermissions?.filter((p) => !member.permissions.has(p));
    const missingBot = cfg.botPermissions?.filter((p) => !guild.members.me?.permissions.has(p));
    const permissions: Record<string, string> = interaction.translate('permissions', { returnObjects: true });

    if (missingMember?.length) {
      const formatted = missingMember.map((p) => `\`${permissions[p.toString()] || p.toString()}\``).join(', ');
      return interaction.error(
        interaction.translate('commandErrors.userMissingPermissions', { permissions: formatted })
      );
    }

    if (missingBot?.length) {
      const formatted = missingBot.map((p) => `\`${permissions[p.toString()] || p.toString()}\``).join(', ');
      return interaction.error(
        interaction.translate('commandErrors.botMissingPermissions', { permissions: formatted })
      );
    }
  }

  try {
    await cmd.run({ client, interaction });
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, 'Command execution failed');
    await interaction.error(interaction.translate('commandErrors.unexpectedError'));
  }
}

function resolveConfig(command: CommandData, interaction: ChatInputCommandInteraction) {
  const subcommandGroup = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand(false);
  const key = [subcommandGroup, subcommand].filter(Boolean).join(' ');

  return Object.fromEntries(
    Object.entries(command.config).map(([k, v]) => {
      if (!Array.isArray(v) && v != null && typeof v === 'object') {
        return [k, (v as Record<string, unknown>)[key] ?? v['*'] ?? null];
      }

      return [k, v];
    })
  ) as CommandOptions;
}
