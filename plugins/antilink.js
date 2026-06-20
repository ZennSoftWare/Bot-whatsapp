export default {
  command: ['antilink'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!db.antilink) db.antilink = {};

    if (!args[0]) {
      return m.reply(
`Status antilink : ${db.antilink[m.chat] ? 'ON 🔒' : 'OFF'}

Contoh:
.antilink on
.antilink off`
      );
    }

    if (args[0].toLowerCase() === 'on') {
      db.antilink[m.chat] = true;
      return m.reply('🔒 Antilink berhasil diaktifkan.\n\nSetiap link grup yang dikirim akan otomatis dihapus.');
    }

    if (args[0].toLowerCase() === 'off') {
      db.antilink[m.chat] = false;
      return m.reply('🔓 Antilink berhasil dimatikan.');
    }
  },

  // Deteksi link di setiap pesan masuk
  async onMessage({ sock, m, db }) {
    if (!m.key.remoteJid.endsWith('@g.us')) return; // hanya di grup
    if (!db.antilink?.[m.key.remoteJid]) return;
    if (m.key.fromMe) return; // skip pesan bot sendiri

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      '';

    // Deteksi link grup WA
    const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com\/\S+|wa\.me\/\S+)/gi;
    if (!linkRegex.test(text)) return;

    const sender = m.key.participant || m.key.remoteJid;

    try {
      // Hapus pesan
      await sock.sendMessage(m.key.remoteJid, {
        delete: m.key
      });

      // Kirim peringatan
      await sock.sendMessage(m.key.remoteJid, {
        text:
`🔒 ANTILINK AKTIF 🔒

⚠️ @${sender.split('@')[0]} dilarang mengirim link grup di sini!

📛 Pesan telah dihapus otomatis.`,
        mentions: [sender]
      });
    } catch (e) {
      console.log('antilink error:', e.message);
    }
  }
};