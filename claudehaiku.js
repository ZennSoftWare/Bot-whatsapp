export default {
  command: ['claudehaiku', 'claude', 'haiku'],
  category: 'ai',
  owner: false,

  async execute({ sock, m, args }) {
    const jid = m.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return m.reply(
`🤍 *Claude Haiku*

AI cepat dan ringan — cocok buat pertanyaan sehari-hari!

*PENGGUNAAN:*
> *.haiku <pertanyaan>*

*CONTOH:*
> *.haiku Jelaskan teori relativitas*
> *.haiku Tips biar produktif*`
      );
    }

    await sock.sendMessage(jid, { react: { text: '🤍', key: m.key } });

    try {
      const res = await fetch(`https://api.siputzx.my.id/api/ai/claude?prompt=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json.status || !json.data) {
        await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
        return m.reply('❌ *Claude Haiku Error*\n\n> Gagal mendapatkan respons, coba lagi nanti.');
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      const reply = json.data;
      await m.reply(reply.length > 4096 ? reply.slice(0, 4096) + '...' : reply);

    } catch (e) {
      console.error('[claudehaiku] error:', e.message);
      await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
      await m.reply('❌ *Claude Haiku Error*\n\n> ' + e.message);
    }
  }
};
