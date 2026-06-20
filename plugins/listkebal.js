export default {
  command: ['listkebal'],
  category: 'security',
  description: 'Menampilkan daftar anggota kebal',
  owner: true,
  group: true,

  async execute({ m, db }) {

    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const kebal = db.kebal[m.chat];

    if (!kebal.length)
      return m.reply('🗿 Belum ada anggota yang memiliki kekebalan.');

    let teks = `🛡️ *DAFTAR ANGGOTA KEBAL*\n\n`;

    for (let i = 0; i < kebal.length; i++) {
      teks += `${i + 1}. @${kebal[i].split('@')[0]}\n`;
    }

    teks += `\n📊 Jumlah : ${kebal.length} anggota`;

    await m.reply(teks, {
      mentions: kebal
    });

  }
};