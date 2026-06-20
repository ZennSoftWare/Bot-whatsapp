import fs from "fs";
import pino from "pino";
import readline from "readline";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

const prefix = ".";
const plugins = {};

// ==================== INPUT NOMOR ====================
function tanyaNomor() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(
      "\n┌─────────────────────────────┐\n│   🤖 ZENN BOT - SETUP AWAL  │\n└─────────────────────────────┘\n\n📱 Masukkan nomor WhatsApp kamu\n   Format: 628xxxxxxxxxx (tanpa + atau spasi)\n\n➤ Nomor: ",
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

  // Kalau belum login, minta nomor dulu
  let nomorOwner = "";
  if (!sudahLogin) {
    nomorOwner = await tanyaNomor();
    if (!nomorOwner) {
      console.log("❌ Nomor tidak boleh kosong!");
      process.exit(1);
    }
    console.log(`\n🔄 Menghubungkan dengan nomor: ${nomorOwner}...\n`);
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["xzeerhBot", "Chrome", "1.0.0"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingDone = false;

  // ==================== KONEKSI ====================
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "connecting" && !sudahLogin && !pairingDone) {
      pairingDone = true;
      await new Promise(r => setTimeout(r, 3000));
      try {
        const code = await sock.requestPairingCode(nomorOwner);
        console.log("┌─────────────────────────────┐");
        console.log("│        🔑 PAIRING CODE       │");
        console.log("├─────────────────────────────┤");
        console.log(`│         ${code}         │`);
        console.log("└─────────────────────────────┘");
        console.log("\n📲 Cara pakai:");
        console.log("   WA → Perangkat Tertaut → Tautkan Perangkat");
        console.log("   → Tautkan dengan nomor telepon → Masukkan kode\n");
      } catch (e) {
        console.log("❌ Gagal mendapatkan pairing code: " + e.message);
        console.log("   Pastikan nomor benar dan coba lagi.");
        process.exit(1);
      }
    }

    if (connection === "open") {
      console.log("✅ Bot berhasil online! Siap digunakan.\n");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("❌ Bot logout! Hapus folder session lalu jalankan ulang.");
        fs.rmSync("./session", { recursive: true, force: true });
        process.exit(0);
      } else {
        console.log("🔄 Koneksi terputus, reconnecting dalam 3 detik...");
        setTimeout(startBot, 3000);
      }
    }
  });

  // ==================== PESAN MASUK ====================
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const m = messages[0];
    if (!m?.message) return;
    if (!m.key.fromMe) return; // mode self

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

    m.reply = async (txt) => {
      await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m });
    };

    try {
      await plugin.execute({ sock, m, args, prefix });
    } catch (e) {
      console.log("Error plugin [" + command + "]:", e.message);
      await m.reply("❌ Error: " + e.message);
    }
  });
}

startBot();