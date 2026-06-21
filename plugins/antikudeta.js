export default {
  command: ['antikudeta'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!db.antikudeta) db.antikudeta = {};
    const groupId = m.key.remoteJid;

    if (!args[0]) {
      const status = db.antikudeta[groupId] ? 'ON ☠️' : 'OFF';
      return m.reply(
`Status anti kudeta grup ini : *${status}*

Contoh:
.antikudeta on
.antikudeta off`
      );
    }

    const arg = args[0].toLowerCase();
    if (arg === 'on') {
      db.antikudeta[groupId] = true;
      return m.reply('☠️ Anti kudeta berhasil diaktifkan di grup ini.');
    }
    if (arg === 'off') {
      db.antikudeta[groupId] = false;
      return m.reply('☠️ Anti kudeta berhasil dimatikan di grup ini.');
    }
  },

  async onParticipantsUpdate({ sock, id, participants, action, author, db }) {
    if (!db.antikudeta?.[id]) return;
    if (!author) return;
    if (action !== 'demote' && action !== 'remove') return;

    // Normalize: ambil angka saja sebelum @ 
    const getNumber = (jid) => jid?.split('@')[0].split(':')[0];

    const botNumber = getNumber(sock.user.id);
    const pelakuNumber = getNumber(author);

    // Skip kalau pelakunya bot sendiri
    if (pelakuNumber === botNumber) return;

    // Cek pelaku ada di daftar kebal
    const daftarKebal = db.kebal?.[id] || [];
    const pelakuKebal = daftarKebal.some(jid => getNumber(jid) === pelakuNumber);
    if (pelakuKebal) return;

    try {
      const metadata = await sock.groupMetadata(id);

      // Cari bot di participants pakai perbandingan NUMBER saja (bukan full JID)
      const botData = metadata.participants.find(p => getNumber(p.id) === botNumber);
      const pelakuData = metadata.participants.find(p => getNumber(p.id) === pelakuNumber);

      console.log("🛡️ botData:", JSON.stringify(botData));
      console.log("🛡️ pelakuData:", JSON.stringify(pelakuData));

      if (!botData) {
        return await sock.sendMessage(id, { text: '⚠️ Bot tidak ditemukan di participants grup!' });
      }

      if (!botData.admin) {
        return await sock.sendMessage(id, { text: '⚠️ Bot belum jadi admin, jadikan terlebih dahulu woi 😹' });
      }

      if (!pelakuData) return; // pelaku sudah tidak di grup

      // Demote pelaku
      await sock.groupParticipantsUpdate(id, [author], 'demote');

      await sock.sendMessage(id, {
        text:
`☠️ ANTI KUDETA AKTIF ☠️

Wkwkwk hama ngapain?
Mau ambil alih grup?

Nyoli aja jangan ambil grup gitu 😹

🚫 Pelaku : @${pelakuNumber}
🛡️ Jabatan berhasil dicabut.`,
        mentions: [author]
      });

    } catch (e) {
      console.log('antikudeta error:', e.message);
      await sock.sendMessage(id, { text: '❌ Antikudeta error: ' + e.message });
    }
  }
};