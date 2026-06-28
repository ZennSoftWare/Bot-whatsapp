export default {
  command: ['antitagsw'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!db.antitagsw) db.antitagsw = {};
    const groupId = m.key.remoteJid;

    if (!args[0]) {
      const status = db.antitagsw[groupId]?.on ? 'ON 🛡️' : 'OFF';
      return m.reply(
`Status anti tag SW grup ini : *${status}*

Contoh:
.antitagsw on
.antitagsw off`
      );
    }

    const arg = args[0].toLowerCase();
    if (arg === 'on') {
      if (!db.antitagsw[groupId] || typeof db.antitagsw[groupId] !== 'object') {
        db.antitagsw[groupId] = { on: false };
      }
      db.antitagsw[groupId].on = true;
      return m.reply('🛡️ Anti tag SW berhasil diaktifkan di grup ini.');
    }
    if (arg === 'off') {
      if (!db.antitagsw[groupId] || typeof db.antitagsw[groupId] !== 'object') {
        db.antitagsw[groupId] = { on: false };
      }
      db.antitagsw[groupId].on = false;
      return m.reply('🛡️ Anti tag SW berhasil dimatikan di grup ini.');
    }
  },

  async onMessage({ sock, m, db }) {
    if (!db.antitagsw) db.antitagsw = {};
    const groupId = m.key.remoteJid;
    if (!groupId?.endsWith('@g.us')) return;
    if (!db.antitagsw[groupId]?.on) return;

    // Deteksi tag SW: pesan yang mengandung konteks dari status WhatsApp
    // Tag SW ditandai dengan contextInfo yang memiliki stanzaId dari status@broadcast
    const contextInfo =
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.imageMessage?.contextInfo ||
      m.message?.videoMessage?.contextInfo ||
      m.message?.stickerMessage?.contextInfo ||
      m.message?.documentMessage?.contextInfo ||
      null;

    const isTagSW =
      contextInfo?.remoteJid === 'status@broadcast' ||
      contextInfo?.participant?.includes('status@broadcast') ||
      contextInfo?.stanzaId?.includes('status');

    if (!isTagSW) return;

    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNum = senderJid?.split('@')[0].split(':')[0];

    try {
      // Hapus pesan tag SW
      await sock.sendMessage(groupId, {
        delete: m.key
      });
    } catch (_) {}

    // Kirim peringatan
    await sock.sendMessage(groupId, {
      text:
`⚠️ *PERINGATAN!*

🚫 Dilarang tag status di grup ini! @${senderNum}`,
      mentions: [senderJid]
    });
  }
};
