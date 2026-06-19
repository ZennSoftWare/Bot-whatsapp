// plugins/demoteall.js

export default {
  command: ['demoteall'],
  category: 'group',
  description: 'Memberhentikan semua admin kecuali owner dan bot',
  admin: true,
  botAdmin: true,
  group: true,

  async execute({ sock, m }) {
    const groupId = m.chat;

    // Ambil metadata grup
    const metadata = await sock.groupMetadata(groupId);
    const participants = metadata.participants;

    // Nomor owner
    const ownerNumber = '447351 572994@s.whatsapp.net';

    // Nomor bot
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Cek apakah bot admin
    const botData = participants.find(p => p.id === botNumber);

    if (!botData?.admin) {
      return m.reply(
        'Tidak bisa memulai pemberhentian massal, bot belum jadi admin 🗿'
      );
    }

    // Cari admin yang akan didemote
    const targets = participants
      .filter(
        p =>
          p.admin && // hanya admin
          p.id !== ownerNumber && // bukan owner
          p.id !== botNumber // bukan bot
      )
      .map(p => p.id);

    if (!targets.length) {
      return m.reply('Tidak ada admin yang bisa diberhentikan.');
    }

    await m.reply(
`⚠️ MEMULAI PEMBERHENTIAN ADMIN SECARA MASSAL ⚠️☠️

🎯 Target : ${targets.length} admin
📉 Status : Proses dimulai`
    );

    let sukses = 0;

    // Demote satu per satu
    for (const jid of targets) {
      try {
        await sock.groupParticipantsUpdate(groupId, [jid], 'demote');
        sukses++;

        // Jeda 1 detik
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (e) {
        console.log(`Gagal demote ${jid}`);
      }
    }

    await m.reply(
`⚠️ PEMBERHENTIAN MASSAL SELESAI ⚠️

✅ Berhasil memberhentikan ${sukses} admin

📉 Semua jabatan telah dicabut.`
    );
  }
};