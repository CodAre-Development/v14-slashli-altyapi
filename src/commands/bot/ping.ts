import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '@/utils/type-guards';

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping'),
  config: {
    category: 'bot'
  },
  run: async ({ interaction, t }) => {
    const start = performance.now();
    await interaction.deferReply();
    const latency = Math.round(performance.now() - start);

    return interaction.editReply({
      content: `
${t('ping.pong')}
${t('ping.roundtrip')}: ${latency}ms
${t('ping.gateway')}: ${interaction.client.ws.ping}ms
`
    });
  }
});
