import {
  type ChatInputCommandInteraction,
  type ColorResolvable,
  EmbedBuilder,
  type EmbedData,
  MessageFlags,
  resolveColor
} from 'discord.js';
import i18next from 'i18next';
import { config } from '@/shared/config';
import { resolveLanguage } from './lang';

export type EmbedType = 'error' | 'success';
export type EmbedOptions = Omit<EmbedData, 'image' | 'thumbnail' | 'color'> & {
  image?: string;
  thumbnail?: string;
  color?: ColorResolvable;
  ephemeral?: boolean;
  language?: string;
};

export function buildEmbed(type: EmbedType, options: EmbedOptions) {
  const titles = i18next.t(`embedTitles.${type}`, {
    returnObjects: true,
    ns: 'common',
    lng: options.language
  });

  const emoji = type === 'error' ? ':x:' : ':white_check_mark:';
  const title = options.title ?? `${emoji} ${titles[Math.floor(Math.random() * titles.length)]}`;
  const color = options.color || config.embedColors[type];

  return new EmbedBuilder({
    ...options,
    title,
    color: resolveColor(color),
    image: options.image ? { url: options.image } : undefined,
    thumbnail: options.thumbnail ? { url: options.thumbnail } : undefined
  });
}

export async function sendEmbed(
  interaction: ChatInputCommandInteraction,
  type: EmbedType,
  optionsOrDesc: EmbedOptions | string
) {
  if (typeof optionsOrDesc === 'string') {
    optionsOrDesc = { description: optionsOrDesc };
  }

  const language = resolveLanguage(optionsOrDesc.language || interaction.locale);
  const embed = buildEmbed(type, { ...optionsOrDesc, language });

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ embeds: [embed], components: [] });
  }

  return interaction.reply({
    embeds: [embed],
    components: [],
    flags: optionsOrDesc.ephemeral ? [MessageFlags.Ephemeral] : undefined
  });
}

export async function sendError(interaction: ChatInputCommandInteraction, optionsOrDesc: EmbedOptions | string) {
  return sendEmbed(interaction, 'error', optionsOrDesc);
}

export async function sendSuccess(interaction: ChatInputCommandInteraction, optionsOrDesc: EmbedOptions | string) {
  return sendEmbed(interaction, 'success', optionsOrDesc);
}
