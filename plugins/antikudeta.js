export default {
  command: ['antikudeta'],
  category: 'group',
  description: 'Melindungi grup dari percobaan kudeta',
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

  async onParticipantsUpdate({
    sock,
    id,
    participants,
    action,
    author,
    db
  }) {

    if (!db.antikudeta?.[id]) return;

    // Nomor owner bot
    const ownerNumber = '447351 572994@s.whatsapp.net';

    // Nomor bot
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Pelaku
    const pelaku = author;

    if (!pelaku) return;

    // Abaikan owner dan bot
    if (pelaku === ownerNumber || pelaku === botNumber) return;

    // Aksi yang dianggap mencurigakan
    if (
      action === 'remove' ||
      action === 'demote'
    ) {

      try {

        // Demote pelaku
        await sock.groupParticipantsUpdate(
          id,
          [pelaku],
          'demote'
        );

        await sock.sendMessage(id, {
          text:
`☠️ ANTI KUDETA AKTIF ☠️

Wkwkwk hama ngapain?
Mau ambil alih grup?

Nyoli aja jangan ambil grup gitu 😹

🚫 Pelaku : @${pelaku.split('@')[0]}
🛡️ Jabatan berhasil dicabut.`,
          mentions: [pelaku]
        });

      } catch (e) {
        console.log(e);
      }

    }

  }
};