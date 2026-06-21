export default {
  command: ['allkick'],
  category: 'group',
  description: 'Mode kudeta grup',
  group: true,

  async execute({ sock, m }) {
    const from = m.key.remoteJid;

    await m.reply('Memulai kudeta massal... Bersiaplah para hama! 💀');

    try {
      const metadata = await sock.groupMetadata(from);

      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const targetOwner = m.key.participant || m.key.remoteJid;

      const listWarga = metadata.participants
        .map(v => v.id)
        .filter(id => id !== botNumber && id !== targetOwner);

      if (listWarga.length === 0) return m.reply('Grup udah sepi, gak ada yang bisa ditendang.');

      await sock.groupParticipantsUpdate(from, listWarga, 'remove');

      return m.reply('✅ *CLEAN SWEEP!* Semua hama sukses dikeluarkan dari grup! ☠️');
    } catch (e) {
      return m.reply('❌ *[ KICKALL GAGAL ]* Bot blom jadi admin woi! jadiin admin dulu sana 🗿');
    }
  }
};