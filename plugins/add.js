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

    const rawNum = args[0].replace(/[^0-9]/g, '');

    if (rawNum.length < 7 || rawNum.length > 15) {
      return m.reply('❌ Nomor tidak valid! Pastikan format benar.\nContoh: .add +628123456789');
    }

    const targetJid = rawNum + '@s.whatsapp.net';

    try {
      const result = await sock.groupParticipantsUpdate(groupId, [targetJid], 'add');
      const status = result?.[0]?.status;
      const errorCode = result?.[0]?.content?.attrs?.code || result?.[0]?.message;

      if (status === '200') {
        await sock.sendMessage(groupId, {
          text:
`✅ *BERHASIL DITAMBAHKAN*

👤 @${rawNum} telah bergabung ke grup ini.`,
          mentions: [targetJid]
        });
      } else if (status === '403') {
        // ✅ FIX: Auto kirim link invite kalau privasi membatasi add langsung
        try {
          const inviteCode = await sock.groupInviteCode(groupId);
          const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
          await m.reply(
`❌ Gagal: +${rawNum} mengaktifkan privasi "siapa yang bisa menambahkan saya ke grup".

📩 Bot otomatis mengirim link invite, tapi tetap harus dikirim manual ke orangnya:
${inviteLink}`
          );
        } catch (e) {
          await m.reply(`❌ Gagal: +${rawNum} membatasi privasi penambahan grup, dan bot gagal generate link invite (${e.message}).`);
        }
      } else if (status === '408') {
        await m.reply(`❌ Gagal: +${rawNum} tidak merespons undangan dalam waktu yang ditentukan.`);
      } else if (status === '409') {
        await m.reply(`❌ +${rawNum} sudah ada di dalam grup.`);
      } else if (status === '500') {
        await m.reply(`❌ Gagal: Nomor +${rawNum} tidak terdaftar di WhatsApp.`);
      } else {
        await m.reply(`⚠️ Status tidak diketahui (${status}) untuk nomor +${rawNum}.\nDetail: ${errorCode || '-'}`);
      }
    } catch (e) {
      await m.reply('❌ Gagal add: ' + e.message);
    }
  }
};
