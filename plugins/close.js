export default {
  command: ['close'],
  category: 'group',
  description: 'Menutup grup',
  owner: true,
  group: true,
  botAdmin: true,

  async execute({ sock, m }) {

    await sock.groupSettingUpdate(
      m.chat,
      'announcement'
    );

    m.reply('🔒 Grup berhasil ditutup.\nHanya admin yang dapat mengirim pesan.');
  }
};