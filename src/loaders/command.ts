import { Glob } from 'bun';
import {
  ApplicationIntegrationType,
  InteractionContextType,
  type Locale,
  REST,
  Routes,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandStringOption,
  type SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { config } from '@/config';
import type { CommandData } from '@/types';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';

type CommandLocalization = {
  name: string;
  description: string;
  options?: Record<string, CommandLocalization>;
  choices?: Record<string, string>;
};

type LocalizationFile = Record<string, CommandLocalization>;

export const commands: CommandData[] = [];

export async function loadCommands(registerToDiscord = false) {
  const localizations = {} as Record<Locale, LocalizationFile>;
  for (const [locale, filePath] of Object.entries(config.bot.supportedLanguages)) {
    const data = await importLanguageFile(filePath);
    if (!data) continue;

    localizations[locale as Locale] = data;
  }

  const glob = new Glob('./src/commands/**/*.ts');
  const publicCommands: CommandData['data'][] = [];
  const adminCommands: CommandData['data'][] = [];

  for await (const fileName of glob.scan('.')) {
    const cmd: CommandData = (await import(`../../${fileName.replace(/\\/g, '/')}`)).default;
    if (!cmd.config.botAdminsOnly) {
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

    const commandList = cmd.config.botAdminsOnly ? adminCommands : publicCommands;
    commandList.push(cmd.data);
    commands.push(cmd);
  }

  if (registerToDiscord) {
    const token = env.BOT_TOKEN;
    // biome-ignore lint/style/noNonNullAssertion: It will exist
    const clientId = Buffer.from(token.split('.')[0]!, 'base64').toString();
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationCommands(clientId), { body: publicCommands });
    logger.info({ scope: 'global' }, 'Registered application commands');

    if (config.guilds.test && adminCommands.length) {
      await rest.put(Routes.applicationGuildCommands(clientId, config.guilds.test.id), {
        body: adminCommands
      });
      logger.info({ scope: 'guild', guildId: config.guilds.test }, 'Registered application commands');
    }
  }
}

function setLocalizations(
  lang: Locale,
  command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder,
  commandData: CommandLocalization
) {
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
