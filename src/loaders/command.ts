import type { Locale, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import { REST, Routes } from 'discord.js';
import { glob } from 'glob';
import config from '@/config';
import client from '@/loaders/client';
import type { CommandData } from '@/types';

type CommandLocalization = {
  name: string;
  localizedName: string;
  localizedDescription: string;
  options?: CommandLocalization[];
}

export default class CommandLoader {
  static async loadCommands(registerOnly = false) {
    const localizations: Record<Locale, CommandLocalization[]> = Object.fromEntries(
      (await Promise.all(
        Object.entries(config.bot.supportedLanguages)
          .map(async ([key, value]) => [key, await this.importLanguageFile(value)])
      )).filter(([, value]) => value !== null)
    );

    const folder = await glob('./dist/commands/**/*.js');
    const commands: CommandData['data'][] = [];
    const adminCommands: CommandData['data'][] = [];

    await Promise.all(folder.map(async value => {
      const file: CommandData = (await import(`../../${value.replace(/\\/g, '/')}`)).default;

      for (const lang in localizations) {
        const language = lang as Locale;
        const commandData = localizations[language]!.find(x => x.name === file.data.name);
        if (commandData) this.setLocalizations(language, file.data, commandData);
      }

      const commandList = file.config.botAdminOnly ? adminCommands : commands;
      commandList.push(file.data);

      if (!registerOnly) client.commands.push(file);
    }));

    if (registerOnly) {
      const token = process.env.BOT_TOKEN!;
      const botId = Buffer.from(token.split('.')[0], 'base64').toString();
      const rest = new REST({ version: '10' }).setToken(token);

      await rest.put(Routes.applicationCommands(botId), { body: commands });
      global.logger.info('Loaded global slash commands');

      if (config.guilds.test && adminCommands.length) {
        await rest.put(Routes.applicationGuildCommands(botId, config.guilds.test), { body: adminCommands });
        global.logger.info('Loaded test guild slash commands');
      }
    }
  }

  static setLocalizations(lang: Locale, command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder, commandData: CommandLocalization) {
    if (!commandData) return;

    command.setNameLocalization(lang, commandData.localizedName);
    command.setDescriptionLocalization(lang, commandData.localizedDescription);

    if (command.options?.length)
      command.options.forEach((option, index) => this.setLocalizations(lang, option as unknown as SlashCommandBuilder, commandData.options![index]));
  }

  private static async importLanguageFile(lang: string) {
    try {
      return (await import(`@/localizations/commandData/${lang}.json`)).default;
    } catch {
      return null;
    }
  }
}