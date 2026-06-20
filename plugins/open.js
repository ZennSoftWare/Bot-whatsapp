export default {
  command: ['open'],
  category: 'group',
  description: 'Membuka grup',
  owner: true,
  group: true,
  botAdmin: true,

  async execute({ sock, m }) {

    await sock.groupSettingUpdate(
      m.chat,
      'not_announcement'
    );

    m.reply('🟢 Grup berhasil dibuka.\nSemua anggota sekarang bisa mengirim pesan.');
  }
};