export default {
  command: ['allkick'],
  category: 'group',
  description: 'Mode kudeta grup',
  group: true,

  async execute({ sock, m }) {
    const groupId = m.key.remoteJid;
    const metadata = await sock.groupMetadata(groupId);
    const participants = metadata.participants;

    // Ambil ID bot dengan benar (format bisa "628xxx:xx@s.whatsapp.net")
    const botId = sock.user.id;
    const botNumber = botId.includes(':') ? botId.split(':')[0] + '@s.whatsapp.net' : botId;

    const ownerNumber = '447351572994@s.whatsapp.net';

    // Cari bot di participants, cocokkan by nomor saja (bukan full ID)
    const botData = participants.find(p => p.id.split(':')[0] + '@s.whatsapp.net' === botNumber);

    if (!botData || !botData.admin) {
      return m.reply('Bot belum jadi admin 🗿\n\nPastikan bot sudah dijadikan admin grup terlebih dahulu.');
    }

    const targets = participants.filter(p => {
      const pNum = p.id.split(':')[0] + '@s.whatsapp.net';
      return pNum !== ownerNumber && pNum !== botNumber;
    }).map(p => p.id);

    if (!targets.length) return m.reply('Tidak ada anggota yang bisa dikeluarkan.');

    await m.reply(`☠️ MEMULAI MODE KUDETA ☠️\n\n🎯 Target : ${targets.length} anggota\n⚡ Status : Pembantaian dimulai`);

    let sukses = 0;
    const batchSize = 5;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      for (const jid of batch) {
        try {
          await sock.groupParticipantsUpdate(groupId, [jid], 'remove');
          sukses++;
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.log(`Gagal kick ${jid}: ${e.message}`);
        }
      }
      if (i + batchSize < targets.length) await new Promise(r => setTimeout(r, 3000));
    }

    await m.reply(`☠️ MODE KUDETA SELESAI ☠️\n\n✅ Berhasil membersihkan ${sukses} anggota\n🏴 Grup telah dikuasai`);
  }
};
