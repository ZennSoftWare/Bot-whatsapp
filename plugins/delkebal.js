export default {
  command: ['delkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    const user = m.mentionedJid?.[0];
    if (!user) return m.reply('Tag orang yang ingin dicabut kekebalannya 😹');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    if (!db.kebal[m.chat].includes(user)) return m.reply('Dia tidak ada dalam daftar kebal 🗿');

    db.kebal[m.chat] = db.kebal[m.chat].filter(jid => jid !== user);
    await m.reply(`🛡️ Kekebalan berhasil dicabut!\n\n@${user.split('@')[0]} tidak lagi kebal 😹`, { mentions: [user] });
  }
};
