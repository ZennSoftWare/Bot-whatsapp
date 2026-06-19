export default {
  command: ['setout'],
  category: 'group',
  description: 'Mengatur pesan keluar',
  owner: true,
  group: true,

  async execute({ m, args, db }) {

    if (!args.length) {
      return m.reply('Mana pesannya woi 😹');
    }

    if (!db.out) db.out = {};

    const text = args.join(' ');
    db.out[m.chat] = text;

    m.reply(
`✅ Pesan berhasil disimpan untuk perpisahan member..

"${text}"`
    );
  },

  async onParticipantsUpdate({ sock, id, participants, action, db }) {

    if (action !== 'remove') return;

    const text = db.out?.[id];
    if (!text) return;

    for (const user of participants) {

      // Ambil PP member yang keluar
      let pp;
      try {
        pp = await sock.profilePictureUrl(user, 'image');
      } catch {
        pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }

      // Ganti @user dengan nomor member yang keluar
      const message = text.replace(
        '@user',
        `@${user.split('@')[0]}`
      );

      // Kirim pesan out
      await sock.sendMessage(id, {
        image: { url: pp },
        caption:
`╭───〔 👋 GOODBYE 〕───⬣

${message}

╰────────────⬣`,
        mentions: [user]
      });

    }

  }
};