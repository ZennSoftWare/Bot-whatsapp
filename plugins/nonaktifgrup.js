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

      const getNum = (jid) => jid?.split('@')[0].split(':')[0];
      const botPhone = getNum(sock.user.id);

      // ✅ FIX: Cari bot via nomor HP, @lid (db.botLid), dan db.botFullId
      const botData = participants.find(p => {
        if (getNum(p.id) === botPhone) return true;
        if (db.botLid && p.lid === db.botLid) return true;
        if (db.botFullId && p.id === db.botFullId) return true;
        if (db.botLid && getNum(p.lid) === getNum(db.botLid)) return true;
        return false;
      });

      // ✅ DEBUG: Log hasil pencarian bot
      console.log('[nonaktifgrup] botPhone:', botPhone);
      console.log('[nonaktifgrup] botData:', botData ? `found: ${botData.id} admin:${botData.admin}` : 'NOT FOUND');
      console.log('[nonaktifgrup] participants:', participants.map(p => `${p.id}|${p.admin}`).join(', '));

      if (!botData) {
        return m.reply(`❌ Bot tidak ditemukan di grup ini! (botPhone: ${botPhone})`);
      }

      if (botData.admin !== 'admin' && botData.admin !== 'superadmin') {
        return m.reply('❌ Bot harus menjadi admin terlebih dahulu!');
      }

      const botId = botData.id;

      await m.reply('⚠️ Memulai proses nonaktifkan grup secara permanen...');

      // 1. Demote semua admin kecuali bot
      const admins = participants.filter(p =>
        (p.admin === 'admin' || p.admin === 'superadmin') && p.id !== botId
      );
      for (const admin of admins) {
        await sock.groupParticipantsUpdate(groupId, [admin.id], 'demote');
        await new Promise(r => setTimeout(r, 800));
      }

      // 2. Kunci grup
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

      // 4. Ganti nama & hapus deskripsi
      await sock.groupUpdateSubject(groupId, '⛔ GROUP TELAH DINONAKTIFKAN PERMANEN');
      await new Promise(r => setTimeout(r, 300));
      await sock.groupUpdateDescription(groupId, '');
      await new Promise(r => setTimeout(r, 300));

      // 5. Bot keluar
      await sock.groupLeave(groupId);

    } catch (e) {
      console.log('[nonaktifgrup] error:', e.message);
      await m.reply('❌ Gagal nonaktifkan grup: ' + e.message);
    }
  }
};
