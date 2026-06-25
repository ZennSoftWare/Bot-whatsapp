export default {
  command: ['promote'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ sock, m, db }) {
    const groupId = m.key.remoteJid;
    const mentioned = m.mentionedJid?.[0];

    if (!mentioned) {
      return m.reply('❌ Tag seseorang dulu!\nContoh: .promote @user');
    }

    const getNum = (jid) => jid?.split('@')[0].split(':')[0];
    const senderNum = getNum(m.sender);
    const targetNum = getNum(mentioned);

    try {
      await sock.groupParticipantsUpdate(groupId, [mentioned], 'promote');

      await sock.sendMessage(groupId, {
        text:
`👑 *PROMOTE ADMIN*

✅ @${targetNum} menjadi admin di grup ini.
🙋 Dipromote oleh @${senderNum}`,
        mentions: [mentioned, m.sender]
      });
    } catch (e) {
      await m.reply('❌ Gagal promote: ' + e.message);
    }
  }
};
