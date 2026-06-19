// plugins/allkick.js

export default {
  command: ['allkick'],
  category: 'group',
  description: 'Mode kudeta grup',
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
        'Tidak bisa memulai mode kudeta, bot belum jadi admin 🗿'
      );
    }

    // Daftar target
    const targets = participants
      .filter(
        p =>
          p.id !== ownerNumber &&
          p.id !== botNumber
      )
      .map(p => p.id);

    if (!targets.length) {
      return m.reply('Tidak ada anggota yang bisa dikeluarkan.');
    }

    // Pesan awal
    await m.reply(
`☠️ MEMULAI MODE KUDETA ☠️

Bersiaplah para hama grup...

🎯 Target : ${targets.length} anggota
⚡ Status : Pembantaian dimulai`
    );

    let sukses = 0;

    // Kick satu per satu
    for (const jid of targets) {
      try {
        await sock.groupParticipantsUpdate(groupId, [jid], 'remove');
        sukses++;

        // Jeda 1 detik
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (e) {
        console.log(`Gagal kick ${jid}`);
      }
    }

    // Pesan akhir
    await m.reply(
`☠️ MODE KUDETA SELESAI ☠️

✅ Berhasil membersihkan ${sukses} anggota
🏴 Grup telah dikuasai

☠️ Tidak ada belas kasihan.`
    );
  }
};