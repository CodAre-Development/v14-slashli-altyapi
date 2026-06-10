import type { TFunction } from 'i18next';
import type { SendEmbedOptions } from '@/utils/sendEmbed';

declare module 'discord.js' {
  interface BaseInteraction {
    language: string;
    t: TFunction;

    success(options: SendEmbedOptions): Promise<Message>;
    success(description: string): Promise<Message>;

    error(options: SendEmbedOptions): Promise<Message>;
    error(description: string): Promise<Message>;
  }
}
