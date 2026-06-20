import fs from "fs";
import pino from "pino";
import readline from "readline";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} from "@whiskeysockets/baileys";

const prefix = ".";
const plugins = {};

// ==================== DATABASE SEDERHANA ====================
const DB_PATH = "./db.json";

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.log("Gagal simpan db:", e.message);
  }
}

const db = loadDB();

// Auto-save db tiap 30 detik
setInterval(() => saveDB(db), 30000);

// ==================== INPUT NOMOR ====================
function tanyaNomor() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(
      "\n┌─────────────────────────────┐\n│   🤖 XZEERH BOT - SETUP AWAL  │\n└─────────────────────────────┘\n\n📱 Masukkan nomor WhatsApp kamu\n   Format: 628xxxxxxxxxx (tanpa + atau spasi)\n   Contoh UK: 447351572994\n\n➤ Nomor: ",
      (nomor) => {
        rl.close();
        resolve(nomor.trim());
      }
    );
  });
}

// ==================== LOAD PLUGIN ====================
console.log("\n🤖 Memuat plugin...\n");
const files = fs.readdirSync("./plugins").filter(f => f.endsWith(".js"));

for (const file of files) {
  try {
    const plugin = await import(`./plugins/${file}`);
    for (const cmd of plugin.default.command) {
      plugins[cmd] = plugin.default;
    }
    console.log(`  ✅ ${file}`);
  } catch (e) {
    console.log(`  ❌ ${file} - ${e.message}`);
  }
}

console.log(`\n  Total plugin: ${Object.keys(plugins).length}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// ==================== START BOT ====================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();
  const sudahLogin = state.creds.registered;

  let nomorOwner = "";
  if (!sudahLogin) {
    nomorOwner = await tanyaNomor();
    if (!nomorOwner) {
      console.log("❌ Nomor tidak boleh kosong!");
      process.exit(1);
    }
    nomorOwner = nomorOwner.replace(/[^0-9]/g, "");
    console.log(`\n🔄 Menghubungkan dengan nomor: ${nomorOwner}...\n`);
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingDone = false;

  // ==================== KONEKSI ====================
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (!sock.authState.creds.registered && !pairingDone && nomorOwner) {
      pairingDone = true;
      await new Promise(r => setTimeout(r, 2000));
      try {
        const code = await sock.requestPairingCode(nomorOwner);
        console.log("┌─────────────────────────────┐");
        console.log("│        🔑 PAIRING CODE       │");
        console.log("├─────────────────────────────┤");
        console.log(`│         ${code}         │`);
        console.log("└─────────────────────────────┘");
        console.log("\n📲 WA → Perangkat Tertaut → Tautkan dengan nomor telepon\n");
      } catch (e) {
        console.log("❌ Gagal mendapatkan pairing code: " + e.message);
        process.exit(1);
      }
    }

    if (connection === "open") {
      console.log("✅ Bot berhasil online! Siap digunakan.\n");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("❌ Bot logout! Menghapus session...");
        fs.rmSync("./session", { recursive: true, force: true });
        process.exit(0);
      } else {
        console.log("🔄 Reconnecting dalam 3 detik...");
        setTimeout(startBot, 3000);
      }
    }
  });

  // ==================== PESAN MASUK ====================
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const m = messages[0];
    if (!m?.message) return;
    if (!m.key.fromMe) return;

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      "";

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(" ");
    const command = args.shift().toLowerCase();
    const plugin = plugins[command];
    if (!plugin) return;

    // Tambah helper
    m.chat = m.key.remoteJid;
    m.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    m.reply = async (txt, opts = {}) => {
      await sock.sendMessage(m.key.remoteJid, { text: txt, ...opts }, { quoted: m });
    };

    try {
      await plugin.execute({ sock, m, args, prefix, db });
      saveDB(db);
    } catch (e) {
      console.log("Error plugin [" + command + "]:", e.message);
      await m.reply("❌ Error: " + e.message);
    }
  });

  // ==================== PARTICIPANTS UPDATE (welcome/goodbye/antikudeta) ====================
  sock.ev.on("group-participants.update", async ({ id, participants, action, author }) => {
    for (const key of Object.keys(plugins)) {
      const plugin = plugins[key];
      if (typeof plugin.onParticipantsUpdate === "function") {
        try {
          await plugin.onParticipantsUpdate({ sock, id, participants, action, author, db });
          saveDB(db);
        } catch (e) {
          console.log("Error onParticipantsUpdate:", e.message);
        }
      }
    }
  });
}

startBot();
