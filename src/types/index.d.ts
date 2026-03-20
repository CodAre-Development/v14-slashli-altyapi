import type {
  ChatInputCommandInteraction,
  ClientEvents,
  ColorResolvable,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import type { client } from '@/loaders/client';

export type Client = typeof client;

type RunFunctionOptions = { client: Client; interaction: ChatInputCommandInteraction };
type RunFunction = (options: RunFunctionOptions) => Promise<unknown>;

export type CommandOptions = {
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
export type CommandConfig = { [K in keyof CommandOptions]: MaybePerSubcommand<CommandOptions[K]> };

export type CommandData = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  config: CommandConfig;
  run: RunFunction;
};

export type EventData<T extends keyof ClientEvents> = {
  name: T;
  once?: boolean;
  run: (client: Client, ...rest: ClientEvents[T]) => void;
};

export type CustomMessageOptions = {
  content: string;
  title: string;
  author: { name: string; iconURL?: string };
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
  color: ColorResolvable;
  thumbnail: string;
  image: string;
  footer: { text: string; iconURL?: string };
  ephemeral: boolean;
};
