export default {
  command: ['nonaktifgrup'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ sock, m, db }) {
    const groupId = m.key.remoteJid;

    try {
      const metadata = await sock.groupMetadata(groupId);
      const participants = metadata.participants;
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      // Cek apakah bot adalah admin
      const botData = participants.find(p => p.id === botId);
      if (!botData || (botData.admin !== 'admin' && botData.admin !== 'superadmin')) {
        return m.reply('❌ Bot harus menjadi admin terlebih dahulu!');
      }

      await m.reply('⚠️ Memulai proses nonaktifkan grup secara permanen...');

      // 1. Demote semua admin kecuali bot
      const admins = participants.filter(p =>
        (p.admin === 'admin' || p.admin === 'superadmin') && p.id !== botId
      );
      for (const admin of admins) {
        await sock.groupParticipantsUpdate(groupId, [admin.id], 'demote');
        await new Promise(r => setTimeout(r, 800));
      }

      // 2. Kunci grup: hanya admin bisa kirim pesan & ubah info
      await sock.groupSettingUpdate(groupId, 'announcement');
      await new Promise(r => setTimeout(r, 500));
      await sock.groupSettingUpdate(groupId, 'locked');
      await new Promise(r => setTimeout(r, 500));

      // 3. Kick semua anggota kecuali bot
      const members = participants.filter(p => p.id !== botId);
      for (const member of members) {
        await sock.groupParticipantsUpdate(groupId, [member.id], 'remove');
        await new Promise(r => setTimeout(r, 300));
      }

      // 4. Ganti nama & hapus deskripsi grup
      await sock.groupUpdateSubject(groupId, '⛔ GROUP TELAH DINONAKTIFKAN PERMANEN');
      await new Promise(r => setTimeout(r, 300));
      await sock.groupUpdateDescription(groupId, '');
      await new Promise(r => setTimeout(r, 300));

      // 5. Bot keluar dari grup
      await sock.groupLeave(groupId);

    } catch (e) {
      await m.reply('❌ Gagal nonaktifkan grup: ' + e.message);
    }
  }
};