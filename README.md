# Discord Bot Template

A lightweight TypeScript template for building Discord bots with discord.js and Bun.

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

When using localization, **do not** set command, subcommand or option descriptions in `SlashCommandBuilder`.
The command loader automatically applies the default descriptions and all localized metadata from the `command-data` localization files during registration.

Example:

```ts
defineCommand({
  data: new SlashCommandBuilder()
    .setName('ping')
    .addStringOption((o) => o.setName('target').setAutocomplete(true)),
  config: {
    category: 'bot'
  },
  run: async ({ interaction, t }) => {
    return sendSuccess(interaction, t('ping.pong'));
  },
  autocomplete: async ({ interaction, t }) => {
    const focused = interaction.options.getFocused();
    return interaction.respond(getMatches(focused));
  }
});
```

## Localization

Translations live in `src/locales/<code>/`.  
To add a new language:

1. Add all namespace files under `src/locales/<code>/`.
2. Add the locale mapping to `languages` in `src/shared/config.ts`.
3. Update the types `src/i18next.d.ts` if you're adding a new namespace.

The language code used as the value in `languages` must match the folder name under `src/locales/`.

### Using translations in commands

Each command's `run()` and `autocomplete()` receives a `t` function already scoped to the `commands` namespace so you don't need to import `i18next` or specify `lng` manually:

```ts
run: async ({ interaction, t }) => {
  return sendSuccess(interaction, t('ping.pong'));
}
```

### Command Data

`command-data.json` contains the localized names, descriptions and choice labels used when registering slash commands to Discord.

Every top-level key must match the original English name passed to `.setName()` and must not be translated. Only the `name`, `description` and choice labels should be localized.

Example (`tr/command-data.json`):

```json
{
  "deep": {
    "name": "derin",
    "description": "Derin bir komut örneği",
    "options": {
      "subcommand-group-name": {
        "name": "alt-komut-grubu",
        "description": "Alt komut grubu örneği",
        "options": {
          "subcommand-name": {
            "name": "alt-komut",
            "description": "Alt komut örneği",
            "options": {
              "option-name": {
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

## Sending Replies

It's recommended to use these helpers instead of calling `interaction.reply()` directly for consistency:

```ts
await sendSuccess(interaction, t('ping.pong'));
await sendError(interaction, { description: t('botAdminsOnly', { ns: 'errors' }) });
```
