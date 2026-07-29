import type { ClientEvents } from 'discord.js';
import type { Command } from '@/loaders/command';
import type { Event } from '@/loaders/event';

export function defineEvent<T extends keyof ClientEvents>(event: Event<T>): Event<T> {
  return event;
}

export function defineCommand(command: Command): Command {
  return command;
}
