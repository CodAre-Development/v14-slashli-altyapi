import { EmbedBuilder, OAuth2Scopes, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { commandList } from '@/loaders/command';
import { config } from '@/shared/config';
import { defineCommand } from '@/utils/define';

export default defineCommand({
  data: new SlashCommandBuilder().setName('help').addStringOption((o) => o.setName('command')),
  config: {
    category: 'bot'
  },
  run: async ({ client, interaction }) => {
    const commandName = interaction.options.getString('command');
    const cmd = commandName && commandList.find((x) => x.data.name.toLowerCase() === commandName.toLowerCase());

    const embed = new EmbedBuilder()
      .setColor(config.embedColors.default)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() });

    if (commandName) {
      if (!cmd || cmd.config.botAdminsOnly) {
        return interaction.error(interaction.t('cmds.help.commandNotFound', { name: `\`${commandName}\`` }));
      }

      const name = cmd.data.name_localizations?.[interaction.language] || cmd.data.name;
      const description = cmd.data.description_localizations?.[interaction.language] || cmd.data.description;
      // biome-ignore lint/style/noNonNullAssertion: Category is required and can't be null
      const category = typeof cmd.config.category === 'string' ? cmd.config.category : cmd.config.category['*']!;

      embed
        .setTitle(name.replace(/\b\w/g, (c) => c.toUpperCase()))
        .setDescription(description)
        .setFields([
          {
            name: interaction.t('cmds.help.details.title'),
            value: `
**${interaction.t('cmds.help.details.category')}**: ${interaction.t(`cmds.help.categories.${category}`)}
`
          }
        ]);
    } else {
      const botInvite = client.generateInvite({
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
        .setTitle(interaction.t('cmds.help.embed.title'))
        .setDescription(interaction.t('cmds.help.embed.description'))
        .setFields([
          {
            name: interaction.t('cmds.help.links.title'),
            value: `
🛠 [${interaction.t('cmds.help.links.supportServer')}](${config.guilds.supportServer.invite})
🔗 [${interaction.t('cmds.help.links.invite')}](${botInvite})
`
          }
        ]);
    }

    return interaction.reply({ embeds: [embed] });
  }
});
