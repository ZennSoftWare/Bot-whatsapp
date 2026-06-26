export default {
  command: ['add'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ sock, m, args }) {
    const groupId = m.key.remoteJid;

    if (!args[0]) {
      return m.reply(
`❌ Masukkan nomor dulu!

Contoh:
.add +628123456789
.add +447351572994
.add 628123456789`
      );
    }

    // Bersihkan nomor: hapus +, spasi, strip, dll → angka saja
    const rawNum = args[0].replace(/[^0-9]/g, '');

    if (rawNum.length < 7 || rawNum.length > 15) {
      return m.reply('❌ Nomor tidak valid! Pastikan format benar.\nContoh: .add +628123456789');
    }

    const targetJid = rawNum + '@s.whatsapp.net';

    try {
      const result = await sock.groupParticipantsUpdate(groupId, [targetJid], 'add');
      const status = result?.[0]?.status;

      // Tangani berbagai status response dari WhatsApp
      if (status === '200') {
        await sock.sendMessage(groupId, {
          text:
`✅ *BERHASIL DITAMBAHKAN*

👤 @${rawNum} telah bergabung ke grup ini.`,
          mentions: [targetJid]
        });
      } else if (status === '403') {
        await m.reply(`❌ Gagal: @+${rawNum} mengizinkan privasi — hanya bisa ditambah oleh kontaknya sendiri.`);
      } else if (status === '408') {
        await m.reply(`❌ Gagal: @+${rawNum} tidak merespons undangan.`);
      } else if (status === '409') {
        await m.reply(`❌ @+${rawNum} sudah ada di dalam grup.`);
      } else if (status === '500') {
        await m.reply(`❌ Gagal: Nomor +${rawNum} tidak terdaftar di WhatsApp.`);
      } else {
        await m.reply(`⚠️ Status tidak diketahui (${status}) untuk nomor +${rawNum}.`);
      }
    } catch (e) {
      await m.reply('❌ Gagal add: ' + e.message);
    }
  }
};
