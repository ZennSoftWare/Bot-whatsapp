export default {
  command: ['demote'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ sock, m, db }) {
    const groupId = m.key.remoteJid;
    const mentioned = m.mentionedJid?.[0];

    if (!mentioned) {
      return m.reply('❌ Tag seseorang dulu!\nContoh: .demote @user');
    }

    const getNum = (jid) => jid?.split('@')[0].split(':')[0];
    const senderNum = getNum(m.sender);
    const targetNum = getNum(mentioned);

    try {
      await sock.groupParticipantsUpdate(groupId, [mentioned], 'demote');

      await sock.sendMessage(groupId, {
        text:
`📉 *DEMOTE ADMIN*

❌ @${targetNum} bukan admin lagi di grup ini.
🙋 Didemote oleh @${senderNum}`,
        mentions: [mentioned, m.sender]
      });
    } catch (e) {
      await m.reply('❌ Gagal demote: ' + e.message);
    }
  }
};
