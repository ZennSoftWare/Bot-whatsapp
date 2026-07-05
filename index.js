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

// ==================== DATABASE ====================
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
if (!db.mode) db.mode = { online: true };

// ✅ FIX 1: saveDB pakai debounce — max 1x save per 5 detik
// Sebelumnya tiap pesan masuk langsung saveDB() = 100 pesan > 100 writeFileSync > CPU/RAM modar
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveDB(db);
    saveTimer = null;
  }, 5000);
}

// Interval backup tetap ada sebagai safety net
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

// ✅ FIX 2: Guard reconnect — cegah loop reconnect saat internet cacat
// Tanpa guard: internet putus > reconnect > putus lagi > reconnect terus > handshake WA spam
let reconnecting = false;

// ==================== START BOT ====================
// ✅ FIX: Catat waktu bot nyala untuk skip pesan lama
let botStartTime = Date.now();

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
      // Reset guard reconnect saat berhasil konek
      reconnecting = false;
      // ✅ FIX: Reset botStartTime setiap kali connect/reconnect
      // Ini penting agar setelah reconnect, pesan lama tetap di-skip
      botStartTime = Date.now();
      console.log("✅ Bot berhasil online! Siap digunakan.\n");
      const botNum = sock.user.id.split('@')[0].split(':')[0];
      if (!db.ownerNum) {
        db.ownerNum = botNum;
        saveDB(db);
        console.log("✅ Nomor owner tersimpan:", botNum);
      }
      db.botJid = sock.user.id;
      scheduleSave();

      // ✅ FIX: Keepalive — kirim ping ke WA setiap 30 detik
      // Mencegah koneksi "tidur" saat bot idle lama (> 1 jam tidak dipakai)
      // Tanpa ini: koneksi WA bisa dormant, bot jadi lambat respons setelah idle
      const keepAliveInterval = setInterval(async () => {
        try {
          await sock.sendPresenceUpdate('available');
        } catch (_) {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Bersihkan interval kalau koneksi tutup
      sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'close') clearInterval(keepAliveInterval);
      });
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("❌ Bot logout! Menghapus session...");
        fs.rmSync("./session", { recursive: true, force: true });
        process.exit(0);
      } else {
        // ✅ FIX 2: Cek guard sebelum reconnect
        if (reconnecting) {
          console.log("⚠️ Reconnect sudah berjalan, skip...");
          return;
        }
        reconnecting = true;
        console.log("🔄 Reconnecting dalam 5 detik...");
        setTimeout(() => {
          startBot().catch(e => {
            console.log("❌ Gagal reconnect:", e.message);
            reconnecting = false;
          });
        }, 5000);
      }
    }
  });

  // ==================== CEK LIST/INTERACTIVE RESPONSE (menu) ====================
  // Harus dicek SEBELUM filter fromMe karena response datang dari user
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const m = messages[0];
    if (!m?.message) return;

    // ✅ FIX: Skip pesan lama yang datang saat bot baru connect
    // Baileys flush pesan pending dari server WA saat pertama konek
    // Akibatnya bot spam respons untuk pesan yang sudah lama dikirim
    const msgTimestamp = (m.messageTimestamp || 0) * 1000;
    if (msgTimestamp && msgTimestamp < botStartTime - 10000) return;

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      "";

    m.chat = m.key.remoteJid;
    m.sender = m.key.participant || m.key.remoteJid;
    m.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    m.reply = async (txt, opts = {}) => {
      await sock.sendMessage(m.key.remoteJid, { text: txt, ...opts }, { quoted: m });
    };

    // Handler list/interactive response (dari user, bukan fromMe)
    const isListResponse =
      !!m.message?.listResponseMessage ||
      !!m.message?.interactiveResponseMessage;

    if (isListResponse && db.mode?.online) {
      const sudahDipanggil = new Set();
      for (const key of Object.keys(plugins)) {
        const plugin = plugins[key];
        if (typeof plugin.onMessage === "function") {
          if (sudahDipanggil.has(plugin)) continue;
          sudahDipanggil.add(plugin);
          try {
            await plugin.onMessage({ sock, m, db });
            scheduleSave(); // ✅ debounce, bukan langsung save
          } catch (e) {
            console.log("Error onMessage listResponse:", e.message);
          }
        }
      }
      return;
    }

    // ==================== CEK onMessage (antilink, antitoxic, dll) ====================
    if (!m.key.fromMe && db.mode?.online) {
      const sudahDipanggil = new Set();
      for (const key of Object.keys(plugins)) {
        const plugin = plugins[key];
        if (typeof plugin.onMessage === "function") {
          if (sudahDipanggil.has(plugin)) continue;
          sudahDipanggil.add(plugin);
          try {
            await plugin.onMessage({ sock, m, db });
            scheduleSave(); // ✅ debounce, bukan langsung save
          } catch (e) {
            console.log("Error onMessage:", e.message);
          }
        }
      }
    }

    // ==================== CEK COMMAND ====================
    if (!m.key.fromMe) return;
    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(" ");
    const command = args.shift().toLowerCase();

    if (!db.mode?.online && command !== "onlinebot") return;

    const plugin = plugins[command];
    if (!plugin) return;

    try {
      await plugin.execute({ sock, m, args, prefix, db });
      scheduleSave(); // ✅ debounce, bukan langsung save
    } catch (e) {
      console.log("Error plugin [" + command + "]:", e.message);
      await m.reply("❌ Error: " + e.message);
    }
  });

  // ==================== PARTICIPANTS UPDATE ====================
  sock.ev.on("group-participants.update", async (data) => {
    console.log("🔔 GROUP EVENT:", JSON.stringify(data));

    const { id, participants, action, author } = data;

    // ✅ FIX 3: Fetch metadata 1x saja, pakai untuk semua keperluan
    // Sebelumnya ada const meta + const meta2 = 2x fetch metadata untuk grup yang sama
    let meta = null;
    try {
      meta = await sock.groupMetadata(id);
    } catch (_) {}

    // Simpan bot ID dari metadata (1x fetch, dipakai semua pengecekan)
    if (author && meta && !db.botLid) {
      const botPhone = sock.user.id.split('@')[0].split(':')[0];
      for (const p of meta.participants) {
        const pPhone = p.id.split('@')[0].split(':')[0];
        if (pPhone === botPhone) {
          db.botPhone = botPhone;
          db.botFullId = p.id;
          if (p.lid) db.botLid = p.lid;
          scheduleSave();
          console.log("✅ Bot ID tersimpan:", db.botFullId, db.botLid || '(no lid)');
          break;
        }
      }

      // Fallback: sock.user.lid
      if (!db.botLid && sock.user?.lid) {
        db.botLid = sock.user.lid;
        scheduleSave();
        console.log("✅ Bot @lid dari sock.user:", db.botLid);
      }

      // Fallback: cari via p.lid === author (pakai meta yang sama, tidak fetch ulang)
      if (!db.botLid && meta) {
        for (const p of meta.participants) {
          if (p.lid && p.lid === author) {
            const pPhone = p.id.split('@')[0].split(':')[0];
            if (pPhone === botPhone) {
              db.botLid = author;
              scheduleSave();
              console.log("✅ Bot @lid dari author event:", db.botLid);
            }
            break;
          }
        }
      }
    }

    if (!db.mode?.online) return;

    const sudahDipanggil = new Set();

    for (const key of Object.keys(plugins)) {
      const plugin = plugins[key];
      if (typeof plugin.onParticipantsUpdate === "function") {
        if (sudahDipanggil.has(plugin)) continue;
        sudahDipanggil.add(plugin);
        try {
          await plugin.onParticipantsUpdate({ sock, id, participants, action, author, db });
          scheduleSave(); // ✅ debounce
        } catch (e) {
          console.log("Error onParticipantsUpdate [" + key + "]:", e.message);
        }
      }
    }
  });
}

startBot();
