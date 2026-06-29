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

    // ✅ FIX: Deteksi tag SW via groupStatusMentionMessage
    // Format WhatsApp terbaru: pesan tag SW bukan extendedTextMessage
    // melainkan groupStatusMentionMessage dengan protocolMessage di dalamnya
    const isTagSW =
      // Format baru: groupStatusMentionMessage
      !!m.message?.groupStatusMentionMessage ||
      // Cek remoteJid status@broadcast di dalam groupStatusMentionMessage
      m.message?.groupStatusMentionMessage?.message?.protocolMessage?.key?.remoteJid === 'status@broadcast' ||
      // Format lama fallback: contextInfo
      m.message?.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast' ||
      m.message?.imageMessage?.contextInfo?.remoteJid === 'status@broadcast' ||
      m.message?.videoMessage?.contextInfo?.remoteJid === 'status@broadcast';

    if (!isTagSW) return;

    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNum = senderJid?.split('@')[0].split(':')[0];

    try {
      await sock.sendMessage(groupId, { delete: m.key });
    } catch (_) {}

    await sock.sendMessage(groupId, {
      text:
`⚠️ *PERINGATAN!*

🚫 Dilarang tag status di grup ini! @${senderNum}`,
      mentions: [senderJid]
    });
  }
};
