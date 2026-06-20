export default {
  command: ['cekkebal'],
  category: 'security',
  description: 'Mengecek apakah seseorang memiliki kekebalan',
  owner: true,
  group: true,

  async execute({ m, db }) {

    let user = m.mentionedJid?.[0];

    if (!user)
      return m.reply('Tag orang yang ingin dicek 😹');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const kebal = db.kebal[m.chat];

    if (kebal.includes(user)) {

      return m.reply(
`🛡️ STATUS KEKEBALAN

👤 @${user.split('@')[0]}
✅ Status : KEBAL 😹

Dia termasuk dalam daftar anggota yang dilindungi.`,
        {
          mentions: [user]
        }
      );

    }

    return m.reply(
`🛡️ STATUS KEKEBALAN

👤 @${user.split('@')[0]}
❌ Status : TIDAK KEBAL 🗿

Dia tidak termasuk dalam daftar anggota yang dilindungi.`,
      {
        mentions: [user]
      }
    );

  }
};