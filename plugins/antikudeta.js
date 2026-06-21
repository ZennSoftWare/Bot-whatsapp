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

    return m.reply('Argumen tidak valid. Gunakan: .antikudeta on / .antikudeta off');
  },

  async onParticipantsUpdate({ sock, id, participants, action, author, db }) {
    // Cek apakah antikudeta aktif di grup ini
    if (!db.antikudeta?.[id]) return;
    if (!author) return;
    if (action !== 'demote' && action !== 'remove') return;

    // Normalize ID — hapus ":xx" dari format Baileys
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const botNumber = normalize(sock.user.id);
    const pelakuNum = normalize(author);

    // Skip kalau pelakunya bot sendiri — cegah bot demote diri sendiri
    if (pelakuNum === botNumber) return;

    // Cek apakah pelaku ada di daftar kebal grup ini
    const daftarKebal = db.kebal?.[id] || [];
    const pelakuKebal = daftarKebal.some(jid => normalize(jid) === pelakuNum);
    if (pelakuKebal) return;

    try {
      // Ambil metadata terbaru untuk cek status bot dan pelaku
      const metadata = await sock.groupMetadata(id);

      // Cek bot masih ada di grup dan masih admin
      const botData = metadata.participants.find(p => normalize(p.id) === botNumber);
      if (!botData) return;
      if (!botData.admin) return;

      // Cek pelaku masih ada di grup
      const pelakuData = metadata.participants.find(p => normalize(p.id) === pelakuNum);
      if (!pelakuData) return;

      // Demote pelaku kudeta
      await sock.groupParticipantsUpdate(id, [author], 'demote');

      await sock.sendMessage(id, {
        text:
`☠️ ANTI KUDETA AKTIF ☠️

Wkwkwk hama ngapain?
Mau ambil alih grup?

Nyoli aja jangan ambil grup gitu 😹

🚫 Pelaku : @${pelakuNum.split('@')[0]}
🛡️ Jabatan berhasil dicabut.`,
        mentions: [author]
      });

    } catch (e) {
      console.log('antikudeta error:', e.message);
    }
  }
};