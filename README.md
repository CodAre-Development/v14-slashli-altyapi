# 🤖 Discord Bot Template

A TypeScript template for creating Discord bots with discord.js and Bun.

## 📦 Setup

1. Clone the repo and install dependencies:

```sh
git clone https://github.com/bur4ky/bot-template.git
cd bot-template
bun install
cp .env.example .env
```

2. Fill in your `.env` file.
3. Register slash commands:

```sh
bun register
```

4. Start the bot:

```sh
bun start
```

## ✨ Features

### ⚙️ Command Handler

Commands are organized under `src/commands`. Each command uses `defineCommand` and supports per-subcommand config overrides:

```ts
defineCommand({
  data: new SlashCommandBuilder() /* ... */,
  config: {
    category: "Bot",
    guildOnly: true,
    disabled: {
      "*": false, // default
      subcommandName: true, // only for "subcommandName"
      "subcommandGroupName subcommandName": true, // only for "subcommandName" in "subcommandGroupName"
    },
  },
  run: async ({ client, interaction }) => {
    // command logic
  },
});
```

### 🌐 Localization

Translations live in `src/localizations`. To add a new language:

1. Create `src/localizations/<code>.json`
2. Create `src/localizations/slashCommands/<code>.json` for command name/description localizations
3. Add the locale to `supportedLanguages` in `src/config.ts`

### 🛠 Interaction Utilities

These are available on any interaction:

- `interaction.success(message | options)` — sends a success embed
- `interaction.error(message | options)` — sends an error embed
- `interaction.translate(key, options)` — translates a key using the interaction's locale

## 📝 License

This project is licensed under the [MIT License](./LICENSE).
