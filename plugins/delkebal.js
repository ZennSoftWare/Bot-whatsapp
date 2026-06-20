export default {
  command: ['delkebal'],
  category: 'security',
  description: 'Menghapus anggota dari daftar kebal',
  owner: true,
  group: true,

  async execute({ m, db }) {

    let user = m.mentionedJid?.[0];

    if (!user)
      return m.reply('Tag orang yang ingin dicabut kekebalannya 😹');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    if (!db.kebal[m.chat].includes(user))
      return m.reply(
`🗿 Dia tidak ada dalam daftar kebal.`
      );

    db.kebal[m.chat] = db.kebal[m.chat].filter(
      jid => jid !== user
    );

    m.reply(
`🛡️ Kekebalan berhasil dicabut..

👤 @${user.split('@')[0]} tidak lagi berada dalam daftar kebal 😹`,
      {
        mentions: [user]
      }
    );

  }
};