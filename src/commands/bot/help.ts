import { EmbedBuilder, OAuth2Scopes, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { commandList } from '@/loaders/command';
import { config } from '@/shared/config';
import { defineCommand } from '@/utils/define';

export default defineCommand({
  data: new SlashCommandBuilder().setName('help').addStringOption((o) => o.setName('command')),
  config: {
    category: 'Bot'
  },
  run: async ({ client, interaction }) => {
    const commandName = interaction.options.getString('command')?.split(' ')[0];
    const command = commandName && commandList.find((x) => x.data.name.toLowerCase() === commandName.toLowerCase());

    const embed = new EmbedBuilder()
      .setTitle(interaction.translate('commands.help.embed.title'))
      .setColor(config.embedColors.default)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL());

    if (commandName) {
      if (!command || command.config.botAdminsOnly) {
        return interaction.error(
          interaction.translate('commands.help.commandNotFound', { name: `\`${commandName}\`` })
        );
      }

      embed.setDescription(command.data.description).setFields([
        {
          name: interaction.translate('commands.help.info.title'),
          value: `
${interaction.translate('commands.help.info.description')}: ${command.data.description}
${interaction.translate('commands.help.info.category')}: ${command.config.category}
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

      embed.setDescription(interaction.translate('commands.help.embed.description')).setFields([
        {
          name: interaction.translate('commands.help.links.title'),
          value: `
🛠 [${interaction.translate('commands.help.links.supportServer')}](${config.guilds.supportServer.invite})
🔗 [${interaction.translate('commands.help.links.invite')}](${botInvite})
`
        }
      ]);
    }

    return interaction.reply({
      embeds: [embed]
    });
  }
});
