# Discord Bot Template

A TypeScript template for building Discord bots with discord.js and Bun.

## Quick Start

1. Clone the repo and install dependencies:

```sh
git clone https://github.com/bur4ky/bot-template.git
cd bot-template
bun install
cp .env.example .env
```

2. Fill in `.env`.

3. Register slash commands:

```sh
bun register
```

4. Start the bot:

```sh
bun start
```

## Command Handler

Each command supports per-subcommand config overrides:

```ts
defineCommand({
  data: new SlashCommandBuilder() /* ... */,
  config: {
    category: "Bot",
    guildOnly: true,
    disabled: {
      "*": false,
      subcommandName: true,
      "subcommandGroupName subcommandName": true,
    },
  },
  run: async ({ client, interaction }) => {
    /* ... */
  }
});
```

> [!IMPORTANT]
> Do not set descriptions in `SlashCommandBuilder()` when the command is localized.  
> The command loader already sets the default description using the default language and applies localized names, descriptions etc automatically.

## Localization

Translations live in `src/localizations`. To add a new language:

1. Add the runtime translation file at `src/localizations/<code>.json`.
2. Add the command registration file at `src/localizations/commandData/<code>.json`.
3. Add the locale mapping in `src/shared/config.ts`.

> [!IMPORTANT]
> Keep the language codes in `supportedLanguages` aligned with the filenames in both localization folders.

## Interaction Helpers

These helpers are added to every interaction:

- `interaction.success(message | options)` sends a success embed.
- `interaction.error(message | options)` sends an error embed.
- `interaction.t(key, options)` translates a key using the interaction's locale.
