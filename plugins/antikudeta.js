export default {
  command: ['antikudeta'],
  category: 'group',
  owner: true,
  botAdmin: true,
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

    const botId = sock.user.id;
    const botNumber = botId.includes(':') ? botId.split(':')[0] + '@s.whatsapp.net' : botId;
    const ownerNumber = '447351572994@s.whatsapp.net';

    // Normalize pelaku
    const pelakuNum = author.split(':')[0] + '@s.whatsapp.net';

    // Abaikan kalau pelakunya owner atau bot sendiri
    if (pelakuNum === ownerNumber || pelakuNum === botNumber) return;

    if (action === 'remove' || action === 'demote') {
      // Cek apakah korbannya owner - kalau iya, restore admin owner dulu
      for (const korban of participants) {
        const korbanNum = korban.split(':')[0] + '@s.whatsapp.net';
        if (korbanNum === ownerNumber) {
          // Restore admin owner yang diturunkan
          try {
            await sock.groupParticipantsUpdate(id, [korban], 'promote');
          } catch (e) {
            console.log('Gagal restore owner:', e.message);
          }
        }
      }

      // Demote pelaku kudeta
      try {
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
