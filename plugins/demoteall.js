export default {
  command: ['demoteall'],
  category: 'group',
  description: 'Memberhentikan semua admin kecuali owner dan bot',
  group: true,

  async execute({ sock, m }) {
    const groupId = m.key.remoteJid;
    const metadata = await sock.groupMetadata(groupId);
    const participants = metadata.participants;

    // Normalize ID: hapus bagian ":xx"
    const normalize = (jid) => jid?.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    const botNumber = normalize(sock.user.id);
    const ownerNumber = '447351572994@s.whatsapp.net';

    // Cari bot di participants pakai normalize
    const botData = participants.find(p => normalize(p.id) === botNumber);

    if (!botData || !botData.admin) {
      return m.reply('Bot belum jadi admin 🗿\n\nPastikan bot sudah dijadikan admin grup terlebih dahulu.');
    }

    const targets = participants.filter(p => {
      const pNum = normalize(p.id);
      return p.admin && pNum !== ownerNumber && pNum !== botNumber;
    }).map(p => p.id);

    if (!targets.length) return m.reply('Tidak ada admin yang bisa diberhentikan.');

    await m.reply(`⚠️ MEMULAI PEMBERHENTIAN ADMIN MASSAL ⚠️\n\n🎯 Target : ${targets.length} admin\n📉 Status : Proses dimulai`);

    let sukses = 0;
    const batchSize = 5;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      for (const jid of batch) {
        try {
          await sock.groupParticipantsUpdate(groupId, [jid], 'demote');
          sukses++;
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.log(`Gagal demote ${jid}: ${e.message}`);
        }
      }
      if (i + batchSize < targets.length) await new Promise(r => setTimeout(r, 3000));
    }

    await m.reply(`⚠️ PEMBERHENTIAN MASSAL SELESAI ⚠️\n\n✅ Berhasil memberhentikan ${sukses} admin\n📉 Semua jabatan telah dicabut.`);
  }
};