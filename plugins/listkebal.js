export default {
  command: ['listkebal'],
  category: 'security',
  owner: true,
  group: true,

  async execute({ m, db }) {
    if (!db.kebal) db.kebal = {};
    if (!db.kebal[m.chat]) db.kebal[m.chat] = [];

    const kebal = db.kebal[m.chat];
    if (!kebal.length) return m.reply('🗿 Belum ada anggota yang memiliki kekebalan di grup ini.');

    let teks = `🛡️ *DAFTAR ANGGOTA KEBAL*\n\n`;
    for (let i = 0; i < kebal.length; i++) {
      const num = kebal[i].split('@')[0].split(':')[0];
      teks += `${i + 1}. @${num}\n`;
    }
    teks += `\n📊 Jumlah : ${kebal.length} anggota\n`;
    teks += `\nMereka tidak akan ditindak oleh antikudeta.`;

    await m.reply(teks, { mentions: kebal });
  }
};