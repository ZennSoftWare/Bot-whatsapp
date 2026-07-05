export default {
  command: ['xzeerh', 'xzeerhbot', 'xzeerhbotai', 'xai'],
  category: 'ai',
  owner: false,

  async execute({ sock, m, args }) {
    const jid = m.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return m.reply(
`🤖 *Xzeerh AI*

> Asisten cerdas siap membantu

*PENGGUNAAN:*
> *.xai <pertanyaan>*

*CONTOH:*
> *.xai Apa itu Node.js?*`
      );
    }

    await sock.sendMessage(jid, { react: { text: '🤖', key: m.key } });

    try {
      const res = await fetch(`https://api.siputzx.my.id/api/ai/meta-llama?prompt=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json.status || !json.data) {
        await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
        return m.reply('❌ *Xzeerh AI Error*\n\n> Gagal mendapatkan respons, coba lagi nanti.');
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      const reply = json.data;
      await m.reply(reply.length > 4096 ? reply.slice(0, 4096) + '...' : reply);

    } catch (e) {
      console.error('[xzeerh-ai] error:', e.message);
      await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
      await m.reply('❌ *Xzeerh AI Error*\n\n> ' + e.message);
    }
  }
};
