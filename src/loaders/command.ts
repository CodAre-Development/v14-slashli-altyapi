import { Glob } from 'bun';
import {
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  type Client,
  InteractionContextType,
  type Locale,
  type PermissionResolvable,
  REST,
  Routes,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandStringOption,
  type SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { config } from '@/shared/config';
import { logger } from '@/shared/logger';

export type CommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type ResolvedCommandConfig = {
  category: 'Bot' | 'Moderation' | 'Admin';
  guildOnly?: boolean;
  dmOnly?: boolean;
  supportServerOnly?: boolean;
  memberPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  botAdminsOnly?: boolean;
  disabled?: boolean;
};

type MaybePerSubcommand<T> = T | Record<string, T>;
export type CommandConfig = { [K in keyof ResolvedCommandConfig]: MaybePerSubcommand<ResolvedCommandConfig[K]> };

export type Command = {
  data: CommandData;
  config: CommandConfig;
  run: (options: { client: Client<true>; interaction: ChatInputCommandInteraction }) => Promise<unknown>;
};

type OptionLocalization = {
  name: string;
  description: string;
  options?: Record<string, OptionLocalization>;
  choices?: Record<string, string>;
};

type CommandLocalization = {
  name: string;
  description: string;
  options?: Record<string, OptionLocalization>;
};

type LocalizationFile = Record<string, CommandLocalization>;

export const commandList: Command[] = [];

export async function loadCommands(registerToDiscord = false) {
  const localizations = {} as Record<Locale, LocalizationFile>;
  commandList.length = 0;

  for (const [locale, filePath] of Object.entries(config.bot.supportedLanguages)) {
    const data = await importLanguageFile(filePath);
    if (!data) continue;

    localizations[locale as Locale] = data;
  }

  const glob = new Glob('./src/commands/**/*.ts');
  const publicCommands: CommandData[] = [];
  const adminCommands: CommandData[] = [];

  for await (const fileName of glob.scan('.')) {
    const cmd: Command = (await import(`../../${fileName.replace(/\\/g, '/')}`)).default;
    const botAdminsOnly = resolveConfigValue(cmd.config.botAdminsOnly) === true;

    if (!botAdminsOnly) {
      cmd.data
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel
        ])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall]);
    }

    for (const lang in localizations) {
      const language = lang as Locale;
      const commandData = localizations[language]?.[cmd.data.name];
      if (commandData) setLocalizations(language, cmd.data, commandData);
    }

    const commandListForRegistration = botAdminsOnly ? adminCommands : publicCommands;
    commandListForRegistration.push(cmd.data);

    commandList.push(cmd);
  }

  if (registerToDiscord) {
    // biome-ignore lint/style/noNonNullAssertion: It will exist
    const clientId = Buffer.from(config.bot.token.split('.')[0]!, 'base64').toString();
    const rest = new REST({ version: '10' }).setToken(config.bot.token);
    await rest.put(Routes.applicationCommands(clientId), { body: publicCommands });
    logger.info({ scope: 'global' }, 'Registered application commands');

    const testGuildId = config.guilds.test.id;
    if (testGuildId && adminCommands.length) {
      const route = Routes.applicationGuildCommands(clientId, testGuildId);
      await rest.put(route, { body: adminCommands });
      logger.info({ scope: 'guild', guildId: testGuildId }, 'Registered application commands');
    }
  }
}

function setLocalizations(lang: Locale, command: CommandData, commandData: CommandLocalization | OptionLocalization) {
  const isDefault = lang === config.bot.defaultLanguage;
  if (isDefault) command.setDescription(commandData.description);

  command.setNameLocalization(lang, commandData.name);
  command.setDescriptionLocalization(lang, commandData.description);

  for (const opt of command.options || []) {
    const option = opt as unknown as SlashCommandBuilder;
    const optionData = commandData.options?.[option.name];
    if (!optionData) continue;

    setLocalizations(lang, option, optionData);

    if (!optionData.choices) continue;

    const stringOption = opt as unknown as SlashCommandStringOption;
    for (const choice of stringOption.choices ?? []) {
      const localizedName = optionData.choices[choice.value];
      if (localizedName) {
        choice.name_localizations ??= {};
        choice.name_localizations[lang] = localizedName;
      }
    }
  }
}

async function importLanguageFile(lang: string) {
  try {
    const file = await import(`@/localizations/commandData/${lang}.json`, {
      with: { type: 'json' }
    });
    return file.default as LocalizationFile;
  } catch {
    return null;
  }
}

function resolveConfigValue<T>(value: MaybePerSubcommand<T> | undefined): T | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value) && typeof value === 'object') {
    return (value as Record<string, T>)['*'];
  }

  return value;
}
