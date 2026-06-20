import fs from "fs";
import pino from "pino";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

const prefix = ".";
const owner = "447351572994";
const plugins = {};

// ==================== LOAD PLUGIN ====================
console.log("🤖 Memuat plugin...");
const files = fs.readdirSync("./plugins").filter(f => f.endsWith(".js"));

for (const file of files) {
  try {
    const plugin = await import(`./plugins/${file}`);
    for (const cmd of plugin.default.command) {
      plugins[cmd] = plugin.default;
    }
    console.log(`✅ ${file}`);
  } catch (e) {
    console.log(`❌ ${file} - ${e.message}`);
  }
}

console.log(`\nTotal plugin: ${Object.keys(plugins).length}`);
console.log("━━━━━━━━━━━━━━\n");

// ==================== START BOT ====================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["ZennBot", "Chrome", "1.0.0"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  // ==================== PAIRING CODE ====================
  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

    if (connection === "connecting") {
      console.log("🔄 Menghubungkan...");

      if (!sock.authState.creds.registered) {
        await new Promise(r => setTimeout(r, 3000)); // tunggu 3 detik dulu
        try {
          const code = await sock.requestPairingCode(owner);
          console.log("━━━━━━━━━━━━━━");
          console.log("🔑 PAIRING CODE: " + code);
          console.log("━━━━━━━━━━━━━━");
        } catch (e) {
          console.log("❌ Gagal dapat pairing code: " + e.message);
        }
      }
    }

    if (connection === "open") {
      console.log("✅ Bot online!");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log("⚠️ Koneksi terputus, kode:", code);
      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        setTimeout(startBot, 3000);
      } else {
        console.log("❌ Logged out. Hapus folder session lalu jalankan ulang.");
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
      await plugin.execute({ sock, m, args, owner, prefix });
    } catch (e) {
      console.log("Error plugin:", e.message);
      await m.reply("❌ Terjadi error: " + e.message);
    }
  });
}

startBot();