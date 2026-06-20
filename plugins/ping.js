import os from 'os';

export default {
  command: ['ping'],
  category: 'main',
  description: 'Cek status dan kecepatan bot',
  owner: true,

  async execute({ sock, m }) {
    const start = Date.now();
    const runtime = process.uptime();
    const days = Math.floor(runtime / 86400);
    const hours = Math.floor(runtime % 86400 / 3600);
    const minutes = Math.floor(runtime % 3600 / 60);
    const seconds = Math.floor(runtime % 60);
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const platform = os.platform();

    await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong!' }, { quoted: m });
    const speed = Date.now() - start;

    await m.reply(
`╭───〔 🏓 PING BOT 〕───⬣

⚡ Kecepatan : ${speed} ms
⏱ Runtime   : ${days} Hari ${hours} Jam ${minutes} Menit ${seconds} Detik
💾 RAM       : ${ram} MB
📱 Platform  : ${platform}
🟢 Status    : Online

╰────────────⬣`
    );
  }
};
