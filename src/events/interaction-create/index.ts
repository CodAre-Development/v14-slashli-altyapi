import type { AutocompleteInteraction, ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';
import { Events } from 'discord.js';
import i18next, { type TFunction } from 'i18next';
import { handleApplicationCommand } from '@/events/interaction-create/application-command';
import { handleAutocomplete } from '@/events/interaction-create/autocomplete';
import type { Command } from '@/loaders/command';
import { config } from '@/shared/config';
import { resolveLanguage } from '@/utils/language';
import { defineEvent } from '@/utils/type-guards';

export default defineEvent({
  name: Events.InteractionCreate,
  run: (interaction) => {
    if (interaction.isChatInputCommand()) {
      return handleApplicationCommand(interaction);
    }

    if (interaction.isAutocomplete()) {
      return handleAutocomplete(interaction);
    }
  }
});

export function checkAccess(
  cmd: Command,
  interaction: ChatInputCommandInteraction | AutocompleteInteraction
): { ok: true } | { ok: false; error: string } {
  const lang = resolveLanguage(interaction.locale);
  const t = i18next.getFixedT(lang, 'errors');

  const isSupportGuild = interaction.guildId === config.guilds.support.id;
  const isDevGuild = interaction.guildId === config.guilds.dev.id;
  const isAdmin = config.bot.admins.has(interaction.user.id);

  if (cmd.config.botAdminsOnly && !isAdmin) {
    return { ok: false, error: t('botAdminsOnly') };
  }

  if (cmd.config.dmOnly && interaction.inGuild()) {
    return { ok: false, error: t('dmOnly') };
  }

  if (cmd.config.guildOnly && !interaction.inGuild()) {
    return { ok: false, error: t('guildOnly') };
  }

  if (cmd.config.supportServerOnly && !isSupportGuild && !isDevGuild) {
    return { ok: false, error: t('supportServerOnly', { invite: config.guilds.support.invite }) };
  }

  if (interaction.inGuild()) {
    const missingMember = interaction.memberPermissions?.missing(cmd.config.memberPermissions ?? []);
    if (missingMember?.length) {
      return {
        ok: false,
        error: t('permissions.missingMember', { permissions: formatPermissions(t, missingMember) })
      };
    }

    const missingBot = interaction.appPermissions?.missing(cmd.config.botPermissions ?? []);
    if (missingBot?.length) {
      return { ok: false, error: t('permissions.missingBot', { permissions: formatPermissions(t, missingBot) }) };
    }
  }

  return { ok: true };
}

function formatPermissions(t: TFunction<'errors'>, missing: PermissionResolvable[]) {
  const names: Record<string, string> = t('permissions', { returnObjects: true, ns: 'common' });
  return missing.map((p) => `\`${names[p.toString()] || p.toString()}\``).join(', ');
}
