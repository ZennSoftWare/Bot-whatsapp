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

    // Ambil angka saja — support @lid dan @s.whatsapp.net
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

      // Cari bot di participants — bandingkan number saja bukan full JID
      const botData = metadata.participants.find(p => getNumber(p.id) === botNumber);
      if (!botData?.admin) return;

      // Cari pelaku di participants
      const pelakuData = metadata.participants.find(p => getNumber(p.id) === pelakuNumber);
      if (!pelakuData) return;

      // Restore jabatan korban yang didemote
      if (action === 'demote') {
        for (const korban of participants) {
          const korbanNumber = getNumber(korban);
          if (korbanNumber === botNumber || korbanNumber === pelakuNumber) continue;
          try {
            await sock.groupParticipantsUpdate(id, [korban], 'promote');
          } catch (e) {
            console.log('Gagal restore korban:', e.message);
          }
        }
      }

      // Demote pelaku
      await sock.groupParticipantsUpdate(id, [author], 'demote');

      await sock.sendMessage(id, {
        text:
`☠️ *ANTI KUDETA AKTIF* ⚠️

Hama ngapain mau ngambil alih grup?
Mending nyoli aja gk usah ngambil gitu 😹

🔄 Jabatan admin korban telah dikembalikan
🚫 Pelaku : @${pelakuNumber}
📉 Jabatan pelaku berhasil dicabut`,
        mentions: [author]
      });

    } catch (e) {
      console.log('antikudeta error:', e.message);
    }
  }
};