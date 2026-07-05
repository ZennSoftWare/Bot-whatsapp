export default {
  command: ['gpt4o', 'gpt4'],
  category: 'ai',
  owner: false,

  async execute({ sock, m, args }) {
    const jid = m.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return m.reply(
`🧠 *GPT-4o*

> Masukkan pertanyaan

*CONTOH:*
> *.gpt4o Hai apa kabar?*`
      );
    }

    await sock.sendMessage(jid, { react: { text: '🕐', key: m.key } });

    try {
      const res = await fetch(`https://api.siputzx.my.id/api/ai/gpt4o?prompt=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json.status || !json.data) {
        await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
        return m.reply('❌ *GPT-4o Error*\n\n> Gagal mendapatkan respons, coba lagi nanti.');
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      const reply = json.data;
      await m.reply(reply.length > 4096 ? reply.slice(0, 4096) + '...' : reply);

    } catch (e) {
      console.error('[gpt4o] error:', e.message);
      await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
      await m.reply('❌ *GPT-4o Error*\n\n> ' + e.message);
    }
  }
};
