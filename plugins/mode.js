export default {
  command: ['onlinebot', 'offlinebot', 'statusbot'],
  category: 'main',
  owner: true,

  async execute({ m, db }) {
    if (!db.mode) db.mode = { online: true };

    const cmd = m.message?.conversation ||
      m.message?.extendedTextMessage?.text || '';
    const command = cmd.slice(1).trim().split(' ')[0].toLowerCase();

    if (command === 'onlinebot') {
      db.mode.online = true;
      return m.reply(
`╭───〔 🟢 BOT ONLINE 〕───⬣

✅ Bot telah diaktifkan!
🤖 Semua perintah kini aktif kembali.

╰────────────⬣`
      );
    }

    if (command === 'offlinebot') {
      db.mode.online = false;
      return m.reply(
`╭───〔 🔴 BOT OFFLINE 〕───⬣

✅ Bot telah dinonaktifkan!
😴 Bot tidak akan merespon perintah apapun.

Ketik .onlinebot untuk mengaktifkan kembali.

╰────────────⬣`
      );
    }

    if (command === 'statusbot') {
      const status = db.mode.online;
      return m.reply(
`╭───〔 📊 STATUS BOT 〕───⬣

${status ? '🟢 Status : ONLINE' : '🔴 Status : OFFLINE'}
${status ? '✅ Bot sedang aktif dan menerima perintah.' : '😴 Bot sedang nonaktif.'}

╰────────────⬣`
      );
    }
  }
};