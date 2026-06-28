import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  proto,
  generateWAMessageFromContent,
  isJidGroup
} from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGES = {
  menu:     path.join(__dirname, '../assets/menu_utama.jpg'),
  main:     path.join(__dirname, '../assets/menu_main.jpg'),
  group:    path.join(__dirname, '../assets/menu_group.png'),
  security: path.join(__dirname, '../assets/menu_security.png'),
  welcome:  path.join(__dirname, '../assets/menu_welcome.png'),
  kudeta:   path.join(__dirname, '../assets/menu_kudeta.png'),
};

const MENU_CONTENT = {
  menu_main:
`🏓 *MAIN MENU*
━━━━━━━━━━━━━━
◇ .ping
◇ .statusbot
◇ .onlinebot
◇ .offlinebot
━━━━━━━━━━━━━━`,

  menu_group:
`👥 *GROUP MENU*
━━━━━━━━━━━━━━
◇ .tagall
◇ .hidetag
◇ .kick @user
◇ .open
◇ .close
◇ .promote @user
◇ .demote @user
◇ .add +62xxxx
◇ .antitagsw on/off
◇ .antitoxic on/off
━━━━━━━━━━━━━━`,

  menu_security:
`🛡️ *SECURITY MENU*
━━━━━━━━━━━━━━
◇ .antikudeta on/off
◇ .antilink on/off
◇ .addkebal @user
◇ .delkebal @user
◇ .listkebal
◇ .cekkebal @user
━━━━━━━━━━━━━━`,

  menu_welcome:
`👋 *WELCOME & GOODBYE*
━━━━━━━━━━━━━━
◇ .setwelcome [pesan]
◇ .setout [pesan]
━━━━━━━━━━━━━━`,

  menu_kudeta:
`☠️ *KUDETA MENU*
━━━━━━━━━━━━━━
◇ .allkick ☠️
◇ .demoteall ☠️
◇ .nonaktifgrup ☠️
━━━━━━━━━━━━━━`,
};

const IMAGE_MAP = {
  menu_main:     IMAGES.main,
  menu_group:    IMAGES.group,
  menu_security: IMAGES.security,
  menu_welcome:  IMAGES.welcome,
  menu_kudeta:   IMAGES.kudeta,
};

function buildInteractiveNodes(jid, badge = true) {
  const nodes = [{
    tag: 'biz', attrs: {}, content: [{
      tag: 'interactive', attrs: { type: 'native_flow', v: '1' },
      content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
    }]
  }];
  if (badge && !isJidGroup(jid)) {
    nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
  }
  return nodes;
}

async function sendList(sock, jid, title, body, footer, buttonText, sections, quoted) {
  const interactiveContent = proto.Message.InteractiveMessage.create({
    header: proto.Message.InteractiveMessage.Header.create({
      title,
      hasMediaAttachment: false
    }),
    body: proto.Message.InteractiveMessage.Body.create({ text: body }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: [{
        name: 'single_select',
        buttonParamsJson: JSON.stringify({ title: buttonText, sections })
      }]
    })
  });

  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: interactiveContent
      }
    }
  }, { userJid: sock.user.id, quoted });

  await sock.relayMessage(jid, msg.message, {
    messageId: msg.key.id,
    additionalNodes: buildInteractiveNodes(jid, true)
  });
}

async function kirimGambar(sock, jid, imgPath, caption, senderJid, quoted) {
  try {
    if (!fs.existsSync(imgPath)) throw new Error('not found');
    const buffer = fs.readFileSync(imgPath);
    await sock.sendMessage(jid, {
      image: buffer,
      mimetype: 'image/jpeg',
      caption,
      mentions: senderJid ? [senderJid] : []
    }, quoted ? { quoted } : {});
  } catch (e) {
    await sock.sendMessage(jid, {
      text: caption,
      mentions: senderJid ? [senderJid] : []
    }, quoted ? { quoted } : {});
  }
}

export default {
  command: ['menu', 'allmenu'],
  category: 'main',
  owner: false,

  async execute({ sock, m, db }) {
    const jid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.remoteJid;
    const senderName = m.pushName || senderJid?.split('@')[0].split(':')[0];

    // Kirim gambar + sapaan
    await kirimGambar(
      sock, jid, IMAGES.menu,
`╔══════════════════╗
   ✦ *XZEERH BOT SYSTEM* ✦
╚══════════════════╝

Halo Owner *${senderName}*! 👋
Selamat datang di *Xzeerh Bot*
Pilih kategori menu di bawah untuk melihat daftar perintah!`,
      senderJid, m
    );

    // ✅ Kirim list menu langsung setelah gambar tanpa jeda
    // ✅ Hapus description di tiap row — hanya tampil title saja
    await sendList(
      sock, jid,
      '✦ XZEERH BOT MENU ✦',
      'Pilih kategori menu yang ingin kamu lihat 👇',
      'Xzeerh Bot • Powered by Baileys',
      '📋 List Menu',
      [
        {
          title: '📂 KATEGORI MENU',
          rows: [
            { title: '🏓 MAIN MENU',         id: 'menu_main' },
            { title: '👥 GROUP MENU',         id: 'menu_group' },
            { title: '🛡️ SECURITY MENU',     id: 'menu_security' },
            { title: '👋 WELCOME & GOODBYE',  id: 'menu_welcome' },
            { title: '☠️ KUDETA MENU',        id: 'menu_kudeta' },
          ]
        }
      ],
      m
    );
  },

  async onMessage({ sock, m, db }) {
    const jid = m.key.remoteJid;

    // Tangkap semua kemungkinan format response dari list interaktif
    let selectedId = null;

    // Format 1: interactiveResponseMessage (native flow — format baru)
    try {
      const paramsJson = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
      if (paramsJson) {
        const parsed = JSON.parse(paramsJson);
        selectedId = parsed?.id || parsed?.selectedId || null;
      }
    } catch (_) {}

    // Format 2: interactiveResponseMessage body (kadang id ada di sini)
    if (!selectedId) {
      try {
        const body = m.message?.interactiveResponseMessage?.body?.text;
        if (body && body.startsWith('menu_')) selectedId = body;
      } catch (_) {}
    }

    // Format 3: listResponseMessage (format lama)
    if (!selectedId) {
      selectedId = m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || null;
    }

    // Format 4: nativeFlowResponseMessage langsung
    if (!selectedId) {
      try {
        const paramsJson = m.message?.nativeFlowResponseMessage?.paramsJson;
        if (paramsJson) {
          const parsed = JSON.parse(paramsJson);
          selectedId = parsed?.id || null;
        }
      } catch (_) {}
    }

    if (!selectedId || !selectedId.startsWith('menu_')) return;
    if (!IMAGE_MAP[selectedId] || !MENU_CONTENT[selectedId]) return;

    // Kirim gambar + seluruh isi menu kategori yang dipilih
    await kirimGambar(sock, jid, IMAGE_MAP[selectedId], MENU_CONTENT[selectedId], null, m);
  }
};
