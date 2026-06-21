export default {
  command: ['cekkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const user = m.mentionedJid?.[0] ||
      m.message?.extendedTextMessage?.contextInfo?.participant ||
      null;

    if (!user) return m.reply('Tag atau balas pesan orang yang ingin dicek!\n\nContoh: .cekkebal @user');

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const userNum = normalize(user);
    const isKebal = db.kebal[m.chat].some(jid => normalize(jid) === userNum);

    await m.reply(
`🛡️ STATUS KEKEBALAN

👤 @${userNum.split('@')[0]}
${isKebal
  ? '✅ Status : KEBAL 😹\n\nDia dilindungi, bot tidak akan menindaknya walau melakukan demote/kick.'
  : '❌ Status : TIDAK KEBAL 🗿\n\nDia akan ditindak bot jika melakukan kudeta.'}`,
      { mentions: [user] }
    );
  }
};