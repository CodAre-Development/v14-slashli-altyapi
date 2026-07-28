import { EmbedBuilder, OAuth2Scopes, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { commands } from '@/loaders/command';
import { config } from '@/shared/config';
import { resolveLanguage } from '@/utils/lang';
import { sendError } from '@/utils/sendEmbed';
import { defineCommand } from '@/utils/typeguards';

export default defineCommand({
  data: new SlashCommandBuilder().setName('help').addStringOption((o) => o.setName('command').setAutocomplete(true)),
  config: {
    category: 'bot'
  },
  run: async ({ interaction, t }) => {
    const commandName = interaction.options.getString('command');
    const embed = new EmbedBuilder()
      .setColor(config.embedColors.default)
      .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() });

    if (commandName) {
      const lang = resolveLanguage(interaction.locale);
      const cmd = commands.find(
        (c) =>
          c.data.name === commandName.toLowerCase() ||
          c.data.name_localizations?.[lang] === commandName.toLocaleLowerCase(lang)
      );
      if (!cmd || cmd.config.botAdminsOnly) {
        return sendError(interaction, t('help.commandNotFound', { name: `\`${commandName}\`` }));
      }

      const name = cmd.data.name_localizations?.[lang] || cmd.data.name;
      const description = cmd.data.description_localizations?.[lang] || cmd.data.description;

      embed
        .setTitle(name.replace(/(^|\s)\p{L}/gu, (c) => c.toLocaleUpperCase(lang)))
        .setDescription(description)
        .setFields([
          {
            name: t('help.details.title'),
            value: `**${t('help.details.category')}**: ${t(`help.categories.${cmd.config.category}`)}`
          }
        ]);
    } else {
      const botInvite = interaction.client.generateInvite({
        permissions: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.SendMessagesInThreads,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.UseExternalEmojis
        ],
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
      });

      embed
        .setTitle(t('help.embed.title'))
        .setDescription(t('help.embed.description'))
        .setFields([
          {
            name: t('help.links.title'),
            value: `
🛠 [${t('help.links.supportServer')}](${config.guilds.support.invite})
🔗 [${t('help.links.invite')}](${botInvite})
`
          }
        ]);
    }

    return interaction.reply({ embeds: [embed] });
  },
  autocomplete: async ({ interaction }) => {
    const query = interaction.options.getFocused();
    const lang = resolveLanguage(interaction.locale);
    const filtered = query
      ? commands.filter(
          (c) =>
            c.data.name.startsWith(query.toLowerCase()) ||
            c.data.name_localizations?.[lang]?.startsWith(query.toLocaleLowerCase(lang))
        )
      : commands;

    return interaction.respond(
      filtered.map((c) => ({
        name: c.data.name_localizations?.[lang] || c.data.name,
        value: c.data.name
      }))
    );
  }
});
