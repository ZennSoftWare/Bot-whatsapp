export default {
  command: ['deepseek', 'ds', 'deepthink'],
  category: 'ai',
  owner: false,

  async execute({ sock, m, args }) {
    const jid = m.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
      return m.reply(
`🧠 *DeepSeek*

AI yang bisa mikir dulu sebelum jawab — cocok buat pertanyaan yang butuh penalaran.

*PENGGUNAAN:*
> *.deepseek <pertanyaan>*

*CONTOH:*
> *.deepseek Jelaskan black hole*
> *.deepseek Buat kode sorting algorithm*

_Bot akan mikir dulu, baru jawab — jadi agak lama sedikit_`
      );
    }

    await sock.sendMessage(jid, { react: { text: '💭', key: m.key } });

    try {
      const res = await fetch(`https://api.siputzx.my.id/api/ai/deepseek-r1?prompt=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json.status || !json.data) {
        await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
        return m.reply('❌ *DeepSeek Error*\n\n> Gagal mendapatkan respons, coba lagi nanti.');
      }

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      const reply = json.data;
      await m.reply(reply.length > 4096 ? reply.slice(0, 4096) + '...' : reply);

    } catch (e) {
      console.error('[deepseek] error:', e.message);
      await sock.sendMessage(jid, { react: { text: '☢', key: m.key } });
      await m.reply('❌ *DeepSeek Error*\n\n> ' + e.message);
    }
  }
};
