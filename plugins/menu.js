import fs from 'fs';

// ============================================================
// MAPPING GAMBAR
// Simpan 6 gambar di folder ./assets/ di server bot kamu
// Nama file sesuaikan dengan yang kamu upload
// ============================================================
const IMAGES = {
  menu:     './assets/menu_utama.jpg',     // Gambar 1 — tampilan awal .menu
  group:    './assets/menu_group.png',     // Gambar 2 — Group/Standard Menu
  security: './assets/menu_security.png',  // Gambar 3 — Security Menu
  welcome:  './assets/menu_welcome.png',   // Gambar 4 — Welcome & Goodbye
  kudeta:   './assets/menu_kudeta.png',    // Gambar 5 — Kudeta Menu
  main:     './assets/menu_main.jpg',      // Gambar 6 — Main Menu
};

// ============================================================
// ISI MENU PER KATEGORI
// ============================================================
const MENU_CONTENT = {
  main:
`🏓 *MAIN MENU*
━━━━━━━━━━━━━━
◇ .ping
◇ .statusbot
◇ .onlinebot
◇ .offlinebot
━━━━━━━━━━━━━━`,

  group:
`👥 *GROUP MENU*
━━━━━━━━━━━━━━
◇ .tagall
◇ .hidetag
◇ .kick @user
◇ .open
◇ .close
◇ .promote @user
◇ .demote @user
◇ .antitagsw on/off
◇ .antitoxic on/off
━━━━━━━━━━━━━━`,

  security:
`🛡️ *SECURITY MENU*
━━━━━━━━━━━━━━
◇ .antikudeta on/off
◇ .antilink on/off
◇ .addkebal @user
◇ .delkebal @user
◇ .listkebal
◇ .cekkebal @user
━━━━━━━━━━━━━━`,

  welcome:
`👋 *WELCOME & GOODBYE*
━━━━━━━━━━━━━━
◇ .setwelcome [pesan]
◇ .setout [pesan]
━━━━━━━━━━━━━━`,

  kudeta:
`☠️ *KUDETA MENU*
━━━━━━━━━━━━━━
◇ .allkick ☠️
◇ .demoteall ☠️
◇ .nonaktifgrup ☠️
━━━━━━━━━━━━━━`,
};

// Fungsi kirim gambar + teks, fallback ke teks kalau gambar gagal
async function sendImageWithText(sock, jid, imagePath, text, quoted) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: text
    }, { quoted });
  } catch (e) {
    await sock.sendMessage(jid, { text }, { quoted });
  }
}

export default {
  command: ['menu', 'allmenu'],
  category: 'main',
  owner: false,

  async execute({ sock, m, db }) {
    const jid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNum = senderJid?.split('@')[0].split(':')[0];

    // Kirim gambar utama + sapaan
    await sendImageWithText(
      sock, jid, IMAGES.menu,
`╔══════════════════╗
   ✦ *XZEERH BOT SYSTEM* ✦
╚══════════════════╝

Halo @${senderNum}! 👋
Selamat datang di *Xzeerh Bot*
Pilih kategori menu di bawah untuk melihat daftar perintah!`,
      m
    );

    // Kirim list menu interaktif
    await sock.sendMessage(jid, {
      listMessage: {
        title: '✦ XZEERH BOT MENU ✦',
        text: 'Pilih kategori menu yang ingin kamu lihat 👇',
        footerText: 'Xzeerh Bot • Powered by Baileys',
        buttonText: '📋 List Menu',
        sections: [
          {
            title: '📂 KATEGORI MENU',
            rows: [
              {
                title: '🏓 MAIN MENU',
                description: 'ping, statusbot, onlinebot, offlinebot',
                rowId: 'menu_main'
              },
              {
                title: '👥 GROUP MENU',
                description: 'tagall, hidetag, kick, open, close, dll',
                rowId: 'menu_group'
              },
              {
                title: '🛡️ SECURITY MENU',
                description: 'antikudeta, antilink, kebal, dll',
                rowId: 'menu_security'
              },
              {
                title: '👋 WELCOME & GOODBYE',
                description: 'setwelcome, setout',
                rowId: 'menu_welcome'
              },
              {
                title: '☠️ KUDETA MENU',
                description: 'allkick, demoteall, nonaktifgrup',
                rowId: 'menu_kudeta'
              },
            ]
          }
        ]
      }
    }, { quoted: m });
  },

  // Tangkap pilihan dari list menu
  async onMessage({ sock, m, db }) {
    const jid = m.key.remoteJid;

    const selectedId =
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || null;

    if (!selectedId || !selectedId.startsWith('menu_')) return;

    const category = selectedId.replace('menu_', '');

    const imageMap = {
      main:     IMAGES.main,
      group:    IMAGES.group,
      security: IMAGES.security,
      welcome:  IMAGES.welcome,
      kudeta:   IMAGES.kudeta,
    };

    if (!imageMap[category] || !MENU_CONTENT[category]) return;

    await sendImageWithText(sock, jid, imageMap[category], MENU_CONTENT[category], m);
  }
};
