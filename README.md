# Discord Bot Template

A TypeScript template for building Discord bots with discord.js and Bun.

## Quick Start

1. Clone the repository and install dependencies:

```sh
git clone https://github.com/bur4ky/bot-template.git
cd bot-template
bun install
cp .env.example .env
```

2. Fill in `.env`.

3. Register slash commands:

```sh
bun run register
```

4. Start the bot:

```sh
bun run start
```

## Command Handler

Commands are defined with `defineCommand()` for type safety.

When using localization, **do not** set command, subcommand or option descriptions in `SlashCommandBuilder`. The command loader automatically applies the default descriptions and all localized metadata from the `commandData` localization files during registration.

```ts
defineCommand({
  data: new SlashCommandBuilder() /* ... */,
  config: {
    category: "bot",
    guildOnly: true
  },
  run: async ({ client, interaction }) => {
    /* ... */
  }
});
```

## Localization

Translations live in `src/localizations`. To add a new language:

1. Add the runtime translation file to `src/localizations/<code>.json`.
2. Add the command localization file to `src/localizations/commandData/<code>.json`.
3. Add the locale mapping in `src/shared/config.ts`.

The language codes in `supportedLanguages` must match the filenames in both localization directories.

### Command Data

`commandData` contains the localized names, descriptions and choice labels used when registering slash commands with Discord.

Every key must match the original English name passed to `setName()` and **must not be translated**. 
Only the `name`, `description` and choice labels should be localized.

Example (`tr.json`):

```json
{
  "deep": {
    "name": "derin",
    "description": "Derin bir komut örneği",
    "options": {
      "subcommand-group": {
        "name": "alt-komut-grubu",
        "description": "Alt komut grubu örneği",
        "options": {
          "subcommand": {
            "name": "alt-komut",
            "description": "Alt komut örneği",
            "options": {
              "option": {
                "name": "seçenek",
                "description": "Seçenek örneği",
                "choices": {
                  "your-choice-value1": "Seçenek 1",
                  "your-choice-value2": "Seçenek 2"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Interaction Helpers

These helpers are added to every interaction:

- `interaction.success(message | options)` sends a success embed.
- `interaction.error(message | options)` sends an error embed.
- `interaction.t(key, options)` translates a key using the interaction's locale.
