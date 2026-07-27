import path from 'node:path';
import {
  type ApplicationCommandOptionBase,
  ApplicationIntegrationType,
  type ChatInputCommandInteraction,
  type Client,
  InteractionContextType,
  type Locale,
  type PermissionResolvable,
  REST,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandStringOption,
  type SlashCommandSubcommandBuilder,
  type SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { config } from '@/shared/config';
import { logger } from '@/shared/logger';

export type CommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type CommandConfig = {
  category: 'bot' | 'moderation' | 'admin';
  guildOnly?: boolean;
  dmOnly?: boolean;
  supportServerOnly?: boolean;
  memberPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  botAdminsOnly?: boolean;
  disabled?: boolean;
};

type RunOptions = { client: Client<true>; interaction: ChatInputCommandInteraction };

export type Command = {
  data: CommandData;
  config: CommandConfig;
  run: (options: RunOptions) => Promise<unknown>;
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

export const commands = new Map<string, Command>();

export async function loadCommands(registerToDiscord = false) {
  commands.clear();

  const localizations = new Map<Locale, LocalizationFile>();
  for (const [locale, filePath] of Object.entries(config.bot.supportedLanguages)) {
    const data = await importLanguageFile(filePath);
    if (!data) continue;

    localizations.set(locale as Locale, data);
  }

  const glob = new Bun.Glob('**/*.ts');
  const publicCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  const adminCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  for await (const filePath of glob.scan({ cwd: path.resolve('src', 'commands'), absolute: true })) {
    const cmd: Command | undefined = (await import(filePath)).default;
    if (!cmd) continue;

    if (!cmd.config.botAdminsOnly) {
      cmd.data
        .setContexts([
          InteractionContextType.Guild,
          InteractionContextType.BotDM,
          InteractionContextType.PrivateChannel
        ])
        .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall]);
    }

    for (const lang of localizations.keys()) {
      const commandData = localizations.get(lang)?.[cmd.data.name];
      if (commandData) setLocalizations(lang, cmd.data as SlashCommandBuilder, commandData);
    }

    (cmd.config.botAdminsOnly ? adminCommands : publicCommands).push(cmd.data.toJSON());
    commands.set(cmd.data.name, cmd);
  }

  if (registerToDiscord) {
    // biome-ignore lint/style/noNonNullAssertion: Can't be null
    const clientId = atob(config.bot.token.split('.')[0]!);
    const rest = new REST().setToken(config.bot.token);
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

function setLocalizations(
  lang: Locale,
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder | ApplicationCommandOptionBase,
  localization: CommandLocalization | OptionLocalization
) {
  const isDefault = lang === config.bot.defaultLanguage;
  if (isDefault) builder.setDescription(localization.description);

  builder.setNameLocalization(lang, localization.name);
  builder.setDescriptionLocalization(lang, localization.description);

  if (!('options' in builder)) return;
  for (const opt of builder.options || []) {
    const option = opt as SlashCommandSubcommandBuilder | ApplicationCommandOptionBase;
    const optionData = localization.options?.[option.name];
    if (!optionData) continue;

    setLocalizations(lang, option, optionData);

    if (!optionData.choices) continue;

    const stringOption = opt as SlashCommandStringOption;
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
