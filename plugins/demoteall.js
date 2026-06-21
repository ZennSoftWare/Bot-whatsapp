export default {
  command: ['demoteall'],
  category: 'group',
  description: 'Memberhentikan semua admin kecuali owner dan bot',
  group: true,

  async execute({ sock, m }) {
    const from = m.key.remoteJid;

    await m.reply('⚠️ Memulai pemberhentian admin massal... 📉');

    try {
      const metadata = await sock.groupMetadata(from);

      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const targetOwner = m.key.participant || m.key.remoteJid;

      const listAdmin = metadata.participants
        .filter(p => p.admin)
        .map(v => v.id)
        .filter(id => id !== botNumber && id !== targetOwner);

      if (listAdmin.length === 0) return m.reply('Tidak ada admin yang bisa diberhentikan.');

      await sock.groupParticipantsUpdate(from, listAdmin, 'demote');

      return m.reply('✅ Semua admin berhasil diberhentikan! 📉');
    } catch (e) {
      return m.reply('❌ Gagal! Pastikan bot sudah jadi admin grup. 🗿');
    }
  }
};