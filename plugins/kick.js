export default {
  command: ['kick'],
  category: 'group',
  owner: true,
  botAdmin: true,
  group: true,

  async execute({ sock, m, args }) {
    const groupId = m.key.remoteJid;

    // Ambil target: dari mention atau reply pesan
    let target =
      m.mentionedJid?.[0] ||
      m.message?.extendedTextMessage?.contextInfo?.participant ||
      null;

    if (!target) {
      return m.reply('Tag atau balas pesan orang yang ingin dikick!\n\nContoh:\n.kick @user\natau balas pesan lalu ketik .kick');
    }

    const metadata = await sock.groupMetadata(groupId);
    const normalize = (jid) => jid.split(':')[0] + '@s.whatsapp.net';
    const botNumber = normalize(sock.user.id);
    const ownerNumber = '447351572994@s.whatsapp.net';
    const targetNum = normalize(target);

    // Proteksi: tidak bisa kick owner atau bot sendiri
    if (targetNum === ownerNumber) return m.reply('Tidak bisa kick owner 😹');
    if (targetNum === botNumber) return m.reply('Tidak bisa kick bot sendiri 🗿');

    // Cek apakah target ada di grup
    const adaDiGrup = metadata.participants.find(p => normalize(p.id) === targetNum);
    if (!adaDiGrup) return m.reply('Orang itu tidak ada di grup ini.');

    try {
      await sock.groupParticipantsUpdate(groupId, [target], 'remove');
      await m.reply(`✅ Berhasil kick @${targetNum.split('@')[0]}`, { mentions: [target] });
    } catch (e) {
      await m.reply('❌ Gagal kick: ' + e.message);
    }
  }
};