import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { config } from '@/config';
import type { CustomMessageOptions } from '@/types';

export async function sendEmbed(
  interaction: ChatInputCommandInteraction,
  options: Partial<CustomMessageOptions> & { embedType: 'error' | 'success' }
) {
  const titles = interaction.translate(`embedTitles.${options.embedType}`, {
    returnObjects: true
  });

  const emoji = options.embedType === 'error' ? ':x:' : ':white_check_mark:';
  const title = options.title ?? `${emoji} ${titles[Math.floor(Math.random() * titles.length)]}`;
  const color = options.color || config.embedColors[options.embedType];

  const embed = new EmbedBuilder()
    .setTitle(title || null)
    .setColor(color || null)
    .setDescription(options.description || null)
    .setAuthor(options.author || null)
    .setThumbnail(options.thumbnail || null)
    .setImage(options.image || null)
    .setFooter(options.footer || null)
    .setFields(options.fields || []);

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ embeds: [embed], components: [] });
  }

  return interaction.reply({
    embeds: [embed],
    components: [],
    flags: options.ephemeral ? [MessageFlags.Ephemeral] : undefined
  });
}
