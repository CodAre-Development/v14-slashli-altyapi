import { Glob } from 'bun';
import type { Client, EventData } from '@/types';

export async function loadEvents(client: Client) {
  const glob = new Glob('./src/events/**/*.ts');
  for await (const fileName of glob.scan('.')) {
    const event = (await import(`../../${fileName.replace(/\\/g, '/')}`)).default;
    if (!isEventData(event)) continue;

    client[event.once ? 'once' : 'on'](event.name, (...params: unknown[]) => event.run(client, ...params));
  }
}

// biome-ignore lint/suspicious/noExplicitAny: We don't know the type of the imported event file
function isEventData(data: any): data is EventData<any> {
  return typeof data === 'object' && typeof data.name === 'string' && typeof data.run === 'function';
}
