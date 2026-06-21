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

    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const botNumber = normalize(sock.user.id);
    const ownerNumber = '447351572994@s.whatsapp.net';
    const pelakuNum = normalize(author);

    // Skip kalau pelakunya bot sendiri atau owner
    if (pelakuNum === botNumber || pelakuNum === ownerNumber) return;

    if (action === 'demote' || action === 'remove') {
      try {
        // Cek dulu metadata grup, pastikan bot masih admin
        const metadata = await sock.groupMetadata(id);
        const botData = metadata.participants.find(p => normalize(p.id) === botNumber);

        // Kalau bot bukan admin, tidak bisa tindak
        if (!botData?.admin) {
          return await sock.sendMessage(id, {
            text: '⚠️ Bot bukan admin, tidak bisa menindak pelaku kudeta!'
          });
        }

        // Cek apakah pelaku masih di grup dan masih admin
        const pelakuData = metadata.participants.find(p => normalize(p.id) === pelakuNum);
        if (!pelakuData) return; // pelaku sudah tidak di grup
        if (!pelakuData.admin) return; // pelaku sudah bukan admin, skip

        // Demote pelaku
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
        await sock.sendMessage(id, {
          text: '⚠️ Gagal menindak pelaku kudeta: ' + e.message
        });
      }
    }
  }
};