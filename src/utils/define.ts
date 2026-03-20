import type { ClientEvents } from 'discord.js';
import type { CommandData, EventData } from '@/types';

export function defineEvent<T extends keyof ClientEvents>(event: EventData<T>): EventData<T> {
  return event;
}

export function defineCommand(command: CommandData): CommandData {
  return command;
}
