export default {
  command: ['antikudeta'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!db.antikudeta) db.antikudeta = {};

    if (!args[0]) {
      return m.reply(
`Status anti kudeta : ${db.antikudeta[m.chat] ? 'ON ☠️' : 'OFF'}

Contoh:
.antikudeta on
.antikudeta off`
      );
    }

    if (args[0].toLowerCase() === 'on') {
      db.antikudeta[m.chat] = true;
      return m.reply('☠️ Anti kudeta berhasil diaktifkan.');
    }

    if (args[0].toLowerCase() === 'off') {
      db.antikudeta[m.chat] = false;
      return m.reply('☠️ Anti kudeta berhasil dimatikan.');
    }
  },

  async onParticipantsUpdate({ sock, id, participants, action, author, db }) {
    if (!db.antikudeta?.[id]) return;
    if (!author) return;

    // Normalize ID hapus ":xx"
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const botNumber = normalize(sock.user.id);
    const pelakuNum = normalize(author);

    // Skip kalau pelakunya bot sendiri — mencegah bot demote diri sendiri
    if (pelakuNum === botNumber) return;

    // Cek apakah pelaku ada di daftar kebal grup ini
    const daftarKebal = db.kebal?.[id] || [];
    const pelakuKebal = daftarKebal.some(jid => normalize(jid) === pelakuNum);
    if (pelakuKebal) return; // pelaku kebal, dianggap tindakan sah bukan kudeta

    if (action === 'demote' || action === 'remove') {
      try {
        // Ambil metadata terbaru
        const metadata = await sock.groupMetadata(id);

        // Cek bot masih admin
        const botData = metadata.participants.find(p => normalize(p.id) === botNumber);
        if (!botData?.admin) return; // bot bukan admin, diam saja

        // Cek pelaku masih di grup dan masih admin
        const pelakuData = metadata.participants.find(p => normalize(p.id) === pelakuNum);
        if (!pelakuData) return; // pelaku sudah tidak di grup
        if (!pelakuData.admin) return; // pelaku sudah bukan admin

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
  }
};