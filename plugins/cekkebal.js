export default {
  command: ['cekkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    const user = m.mentionedJid?.[0];
    if (!user) return m.reply('Tag orang yang ingin dicek 😹');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const isKebal = db.kebal[m.chat].includes(user);

    await m.reply(
`🛡️ STATUS KEKEBALAN

👤 @${user.split('@')[0]}
${isKebal ? '✅ Status : KEBAL 😹\n\nDia termasuk dalam daftar anggota yang dilindungi.' : '❌ Status : TIDAK KEBAL 🗿\n\nDia tidak termasuk dalam daftar anggota yang dilindungi.'}`,
      { mentions: [user] }
    );
  }
};
