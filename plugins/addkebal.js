export default {
  command: ['addkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    const user = m.mentionedJid?.[0];
    if (!user) return m.reply('Tag orang yang ingin dibuat kebal 😹');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    if (db.kebal[m.chat].includes(user)) return m.reply('Dia sudah kebal 😹');

    db.kebal[m.chat].push(user);
    await m.reply(`🛡️ Add kebal berhasil!\n\n@${user.split('@')[0]} telah dimasukkan ke daftar kebal.`, { mentions: [user] });
  }
};
