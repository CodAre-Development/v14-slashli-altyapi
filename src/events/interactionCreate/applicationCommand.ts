import type { ChatInputCommandInteraction, Client, PermissionsBitField } from 'discord.js';
import { type CommandConfig, commandList, type ResolvedCommandConfig } from '@/loaders/command';
import { config } from '@/shared/config';
import { logger } from '@/shared/logger';

export async function applicationCommandHandler(client: Client<true>, interaction: ChatInputCommandInteraction) {
  const cmd = commandList.find((x) => x.data.name === interaction.commandName);
  if (!cmd) return;

  const cfg = resolveConfig(cmd.config, interaction);
  const guildId = interaction.guildId;
  const isSupportServer = guildId === config.guilds.supportServer.id || guildId === config.guilds.test.id;
  const isAdmin = config.bot.admins.includes(interaction.user.id);

  if (cfg.botAdminsOnly && !isAdmin) {
    return interaction.error(interaction.t('commandErrors.botAdminsOnly'));
  }

  if (cfg.disabled) {
    return interaction.error(interaction.t('commandErrors.disabled'));
  }

  if (cfg.dmOnly && interaction.inGuild()) {
    return interaction.error(interaction.t('commandErrors.dmOnly'));
  }

  if (cfg.guildOnly && !interaction.inGuild()) {
    return interaction.error(interaction.t('commandErrors.guildOnly'));
  }

  if (cfg.supportServerOnly && !isSupportServer) {
    return interaction.error(
      interaction.t('commandErrors.supportServerOnly', { invite: config.guilds.supportServer.invite })
    );
  }

  try {
    if (interaction.inGuild() && (cfg.memberPermissions?.length || cfg.botPermissions?.length)) {
      const { memberPermissions, botPermissions } = await resolvePermissions(client, interaction);
      const permissions: Record<string, string> = interaction.t('permissions', { returnObjects: true });

      const missingMember = cfg.memberPermissions?.filter((p) => !memberPermissions?.has(p));
      const missingBot = cfg.botPermissions?.filter((p) => !botPermissions?.has(p));

      if (missingMember?.length) {
        const formatted = missingMember.map((p) => `\`${permissions[p.toString()] || p.toString()}\``).join(', ');
        return interaction.error(interaction.t('commandErrors.userMissingPermissions', { permissions: formatted }));
      }

      if (missingBot?.length) {
        const formatted = missingBot.map((p) => `\`${permissions[p.toString()] || p.toString()}\``).join(', ');
        return interaction.error(interaction.t('commandErrors.botMissingPermissions', { permissions: formatted }));
      }
    }

    await cmd.run({ client, interaction });
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, 'Command execution failed');
    await interaction.error(interaction.t('commandErrors.unexpectedError'));
  }
}

function resolveConfig(config: CommandConfig, interaction: ChatInputCommandInteraction): ResolvedCommandConfig {
  const subcommandGroup = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand(false);
  const key = [subcommandGroup, subcommand].filter(Boolean).join(' ');

  const entries = Object.entries(config).map(([k, v]) => {
    const isSubcommandMap = v !== null && typeof v === 'object' && !Array.isArray(v);
    if (!isSubcommandMap) return [k, v];

    const map = v as Record<string, unknown>;
    return [k, map[key] ?? map['*'] ?? null];
  });

  return Object.fromEntries(entries) as ResolvedCommandConfig;
}

async function resolvePermissions(
  client: Client<true>,
  interaction: ChatInputCommandInteraction
): Promise<{
  memberPermissions: PermissionsBitField | null;
  botPermissions: PermissionsBitField | null;
}> {
  if (!interaction.inGuild()) {
    return { memberPermissions: null, botPermissions: null };
  }

  const memberPermissions = interaction.memberPermissions || null;
  const botPermissions = interaction.appPermissions || interaction.guild?.members.me?.permissions || null;

  if (memberPermissions && botPermissions) {
    return { memberPermissions, botPermissions };
  }

  const guild = interaction.guild || (interaction.guildId ? await client.guilds.fetch(interaction.guildId) : null);
  if (!guild) {
    return { memberPermissions, botPermissions };
  }

  const [member, botMember] = await Promise.all([
    memberPermissions ? null : guild.members.fetch(interaction.user.id),
    botPermissions ? null : guild.members.fetchMe()
  ]);

  return {
    memberPermissions: memberPermissions || member?.permissions || null,
    botPermissions: botPermissions || botMember?.permissions || null
  };
}
