export default {
  command: ['setwelcome'],
  category: 'group',
  description: 'Mengatur pesan welcome',
  owner: true,
  group: true,

  async execute({ m, args, db }) {

    if (!args.length) {
      return m.reply('Mana pesannya woi 😹');
    }

    if (!db.welcome) db.welcome = {};

    const text = args.join(' ');
    db.welcome[m.chat] = text;

    m.reply(
`✅ Pesan berhasil disimpan untuk menyambut member..

"${text}"`
    );
  },

  async onParticipantsUpdate({ sock, id, participants, action, db }) {

    if (action !== 'add') return;

    const text = db.welcome?.[id];
    if (!text) return;

    for (const user of participants) {

      // Ambil foto profil
      let pp;
      try {
        pp = await sock.profilePictureUrl(user, 'image');
      } catch {
        pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }

      // Ganti @user menjadi mention anggota baru
      const message = text.replace(
        '@user',
        `@${user.split('@')[0]}`
      );

      // Kirim welcome dengan PP
      await sock.sendMessage(id, {
        image: { url: pp },
        caption:
`╭───〔 👋 WELCOME 〕───⬣

${message}

╰────────────⬣`,
        mentions: [user]
      });

    }

  }
};