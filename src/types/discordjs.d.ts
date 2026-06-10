import type { Locale } from 'discord.js';
import type { TFunction } from 'i18next';
import type { SendEmbedOptions } from '@/utils/sendEmbed';

declare module 'discord.js' {
  interface BaseInteraction {
    /** Same as `interaction.locale` but falls back to the default language if the locale is unsupported */
    language: Locale;
    t: TFunction;

    success(options: SendEmbedOptions): Promise<Message>;
    success(description: string): Promise<Message>;

    error(options: SendEmbedOptions): Promise<Message>;
    error(description: string): Promise<Message>;
  }
}
