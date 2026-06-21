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

    // Normalize ID: hapus bagian ":xx" dari ID
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const botNumber = normalize(sock.user.id);
    const ownerNumber = '447351572994@s.whatsapp.net';
    const pelakuNum = normalize(author);

    // Kalau yang bertindak bot sendiri atau owner → SKIP, jangan re-trigger
    if (pelakuNum === botNumber || pelakuNum === ownerNumber) return;

    // Ada yang demote/kick siapapun → anggap kudeta → demote pelaku
    if (action === 'demote' || action === 'remove') {
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