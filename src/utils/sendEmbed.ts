import {
  type ChatInputCommandInteraction,
  type ColorResolvable,
  EmbedBuilder,
  type EmbedData,
  MessageFlags,
  resolveColor
} from 'discord.js';
import { config } from '@/config';

export type SendEmbedOptions = Omit<EmbedData, 'image' | 'thumbnail' | 'color'> & {
  image?: string;
  thumbnail?: string;
  color?: ColorResolvable;
  ephemeral?: boolean;
};

export async function sendEmbed(
  interaction: ChatInputCommandInteraction,
  options: SendEmbedOptions & { embedType: 'error' | 'success' }
) {
  const titles = interaction.translate(`embedTitles.${options.embedType}`, {
    returnObjects: true
  });

  const emoji = options.embedType === 'error' ? ':x:' : ':white_check_mark:';
  const title = options.title ?? `${emoji} ${titles[Math.floor(Math.random() * titles.length)]}`;
  const color = options.color || config.embedColors[options.embedType];

  const embed = new EmbedBuilder({
    ...options,
    title,
    color: resolveColor(color),
    image: options.image ? { url: options.image } : undefined,
    thumbnail: options.thumbnail ? { url: options.thumbnail } : undefined
  });

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ embeds: [embed], components: [] });
  }

  return interaction.reply({
    embeds: [embed],
    components: [],
    flags: options.ephemeral ? [MessageFlags.Ephemeral] : undefined
  });
}
