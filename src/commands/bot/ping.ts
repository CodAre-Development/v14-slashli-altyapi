import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '@/utils/define';

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription("Check the bot's latency and response time"),
  config: {
    category: 'Bot'
  },
  run: async ({ client, interaction }) => {
    const before = performance.now();
    await interaction.reply({ content: 'Ping' });

    const latency = Math.round(performance.now() - before);
    return interaction.editReply({
      content: `
🏓 Pong!
REST: ${latency}ms
Gateway: ${client.ws.ping}ms
`
    });
  }
});
