import { Glob } from 'bun';
import type { Client, ClientEvents } from 'discord.js';

export type Event<T extends keyof ClientEvents> = {
  name: T;
  once?: boolean;
  run: (client: Client<true>, ...rest: ClientEvents[T]) => void;
};

export async function loadEvents(client: Client<true>) {
  const glob = new Glob('./src/events/**/*.ts');
  for await (const filePath of glob.scan({ absolute: true })) {
    const event = (await import(filePath)).default;
    if (!isEvent(event)) continue;

    client[event.once ? 'once' : 'on'](event.name, (...params: unknown[]) => event.run(client, ...params));
  }
}

// biome-ignore lint/suspicious/noExplicitAny: We don't care about the name
function isEvent(data: any): data is Event<any> {
  return typeof data === 'object' && typeof data.name === 'string' && typeof data.run === 'function';
}
