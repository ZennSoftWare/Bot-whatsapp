export default {
  command: ['delkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const user = m.mentionedJid?.[0] ||
      m.message?.extendedTextMessage?.contextInfo?.participant ||
      null;

    if (!user) return m.reply('Tag atau balas pesan orang yang ingin dicabut kekebalannya!\n\nContoh: .delkebal @user');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const userNum = normalize(user);
    const adaDiKebal = db.kebal[m.chat].some(jid => normalize(jid) === userNum);
    if (!adaDiKebal) return m.reply('Dia tidak ada dalam daftar kebal 🗿');

    db.kebal[m.chat] = db.kebal[m.chat].filter(jid => normalize(jid) !== userNum);
    await m.reply(
`🛡️ Kekebalan berhasil dicabut!

@${userNum.split('@')[0]} tidak lagi kebal.
Bot akan menindak dia jika melakukan kudeta.`,
      { mentions: [user] }
    );
  }
};