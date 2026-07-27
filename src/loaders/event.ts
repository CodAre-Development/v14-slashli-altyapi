import path from 'node:path';
import type { Client, ClientEvents } from 'discord.js';

export type Event<T extends keyof ClientEvents> = {
  name: T;
  once?: boolean;
  run: (client: Client<true>, ...rest: ClientEvents[T]) => void;
};

export async function loadEvents(client: Client<true>) {
  const glob = new Bun.Glob('**/*.ts');
  for await (const filePath of glob.scan({ cwd: path.resolve('src', 'events'), absolute: true })) {
    // biome-ignore lint/suspicious/noExplicitAny: We don't care about the name
    const event: Event<any> | undefined = (await import(filePath)).default;
    if (!event) continue;

    client[event.once ? 'once' : 'on'](event.name, (...params: unknown[]) => event.run(client, ...params));
  }
}
