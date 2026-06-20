export default {
  command: ['setwelcome'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!args.length) return m.reply('Mana pesannya woi 😹\n\nContoh: .setwelcome Selamat datang @user!');

    if (!db.welcome) db.welcome = {};
    const text = args.join(' ');
    db.welcome[m.chat] = text;

    await m.reply(`✅ Pesan welcome berhasil disimpan!\n\n"${text}"\n\nGunakan @user untuk mention anggota baru.`);
  },

  async onParticipantsUpdate({ sock, id, participants, action, db }) {
    if (action !== 'add') return;
    const text = db.welcome?.[id];
    if (!text) return;

    for (const user of participants) {
      let pp;
      try {
        pp = await sock.profilePictureUrl(user, 'image');
      } catch {
        pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
      }

      const message = text.replace('@user', `@${user.split('@')[0]}`);

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
