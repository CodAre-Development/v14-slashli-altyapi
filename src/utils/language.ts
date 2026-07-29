import { config } from '@/shared/config';

type SupportedLanguage = keyof typeof config.bot.languages;

export function resolveLanguage(language: string): SupportedLanguage {
  return language in config.bot.languages ? (language as SupportedLanguage) : config.bot.defaultLanguage;
}
