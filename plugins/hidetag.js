export default {
  command: ['hidetag'],
  category: 'group',
  description: 'Mention semua anggota secara tersembunyi',
  owner: true,
  group: true,

  async execute({ sock, m, args }) {

    const text = args.join(' ');

    if (!text)
      return m.reply('Mana pesannya woi 😹');

    const metadata = await sock.groupMetadata(m.chat);

    const mentions = metadata.participants.map(
      p => p.id
    );

    await sock.sendMessage(m.chat, {
      text,
      mentions
    });

  }
};