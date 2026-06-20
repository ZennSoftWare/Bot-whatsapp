export default {
  command: ['tagall'],
  category: 'group',
  description: 'Tag semua anggota',
  owner: true,
  group: true,

  async execute({ sock, m, args }) {

    const metadata = await sock.groupMetadata(m.chat);

    let teks = args.join(' ');

    if (!teks)
      teks = '📢 Tag All Member';

    let pesan = `📢 *TAG ALL*\n\n${teks}\n\n`;

    let mentions = [];

    for (let member of metadata.participants) {

      mentions.push(member.id);

      pesan += `⭔ @${member.id.split('@')[0]}\n`;

    }

    await sock.sendMessage(m.chat, {
      text: pesan,
      mentions
    });

  }
};