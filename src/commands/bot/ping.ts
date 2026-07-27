import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '@/utils/define';

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping'),
  config: {
    category: 'bot'
  },
  run: async ({ client, interaction }) => {
    const before = performance.now();
    await interaction.deferReply();

    const latency = Math.round(performance.now() - before);
    return interaction.editReply({
      content: `
${interaction.t('cmds.ping.pong')}
${interaction.t('cmds.ping.roundtrip')}: ${latency}ms
${interaction.t('cmds.ping.gateway')}: ${client.ws.ping}ms
`
    });
  }
});
