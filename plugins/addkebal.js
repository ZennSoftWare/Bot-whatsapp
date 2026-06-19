export default {
  command: ['addkebal'],
  owner: true,
  group: true,

  async execute({ m, db }) {

    let user = m.mentionedJid?.[0];

    if (!user)
      return m.reply('Tag orang yang ingin dibuat kebal 😹');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    if (db.kebal[m.chat].includes(user))
      return m.reply('Dia sudah kebal 😹');

    db.kebal[m.chat].push(user);

    m.reply(
`🛡️ Add kebal berhasil diaktifkan..

@${user.split('@')[0]} telah dimasukkan ke daftar kebal.`,
      { mentions: [user] }
    );
  }
};