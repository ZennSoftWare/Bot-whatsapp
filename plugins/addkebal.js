export default {
  command: ['addkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const user = m.mentionedJid?.[0] ||
      m.message?.extendedTextMessage?.contextInfo?.participant ||
      null;

    if (!user) return m.reply('Tag atau balas pesan orang yang ingin dibuat kebal!\n\nContoh: .addkebal @user');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const userNum = normalize(user);
    const sudahKebal = db.kebal[m.chat].some(jid => normalize(jid) === userNum);
    if (sudahKebal) return m.reply('Dia sudah kebal 😹');

    db.kebal[m.chat].push(user);
    await m.reply(
`🛡️ Add kebal berhasil!

@${userNum.split('@')[0]} telah dimasukkan ke daftar kebal.
Bot tidak akan menindak dia walau melakukan demote/kick.`,
      { mentions: [user] }
    );
  }
};