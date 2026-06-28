export default {
  command: ['antitoxic'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!db.antitoxic) db.antitoxic = {};
    const groupId = m.key.remoteJid;

    if (!args[0]) {
      const status = db.antitoxic[groupId]?.on ? 'ON 🛡️' : 'OFF';
      return m.reply(
`Status anti toxic grup ini : *${status}*

Contoh:
.antitoxic on
.antitoxic off`
      );
    }

    const arg = args[0].toLowerCase();
    if (arg === 'on') {
      if (!db.antitoxic[groupId] || typeof db.antitoxic[groupId] !== 'object') {
        db.antitoxic[groupId] = { on: false, warnings: {} };
      }
      db.antitoxic[groupId].on = true;
      return m.reply('🛡️ Anti toxic berhasil diaktifkan di grup ini.');
    }
    if (arg === 'off') {
      if (!db.antitoxic[groupId] || typeof db.antitoxic[groupId] !== 'object') {
        db.antitoxic[groupId] = { on: false, warnings: {} };
      }
      db.antitoxic[groupId].on = false;
      return m.reply('🛡️ Anti toxic berhasil dimatikan di grup ini.');
    }
  },

  async onMessage({ sock, m, db }) {
    if (!db.antitoxic) db.antitoxic = {};
    const groupId = m.key.remoteJid;
    if (!groupId?.endsWith('@g.us')) return;
    if (!db.antitoxic[groupId]?.on) return;
    if (!db.antitoxic[groupId].warnings) db.antitoxic[groupId].warnings = {};

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      '';

    if (!text) return;

    // Normalisasi teks: huruf kecil, hapus spasi berlebih
    // Ganti karakter pengganti umum yang dipakai untuk bypass filter
    const normalize = (str) => {
      return str
        .toLowerCase()
        // Ganti angka/simbol yang mirip huruf
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/0/g, 'o')
        .replace(/5/g, 's')
        .replace(/8/g, 'b')
        .replace(/\$/g, 's')
        .replace(/@/g, 'a')
        .replace(/\+/g, 't')
        .replace(/\*/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '')
        .replace(/!/g, 'i')
        .replace(/_/g, '')
        .replace(/-/g, '')
        // Hapus spasi di antara huruf (b o d o h → bodoh)
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Hilangkan huruf yang diulang (bodohhh → bodoh, anjirrrr → anjir)
    const collapseRepeats = (str) => str.replace(/(.)\1{2,}/g, '$1$1');

    const cleaned = collapseRepeats(normalize(text));

    // ============================================================
    // DAFTAR KATA TOXIC — bisa ditambah/edit sesuai kebutuhan
    // Pakai regex agar mendeteksi variasi penulisan
    // ============================================================
    const toxicPatterns = [
      // === MAKIAN UMUM ===
      /\banj(ir|ing|eng|ay|i+r?|e+ng?)?\b/,
      /\banz\b/,
      /\bb(a|o)d(o+h?|0+h?)\b/,
      /\bbgst?\b/,
      /\bbangsat\b/,
      /\bb4ngsat\b/,
      /\bgoblo+k\b/,
      /\bgo+bl\b/,
      /\bng?entot\b/,
      /\bnt?ot\b/,
      /\bk(o|0)ntr?(o|0)l?\b/,
      /\bkontol\b/,
      /\bk0nt0l\b/,
      /\bkntl\b/,
      /\bmem(e|3)k\b/,
      /\bm3m3k\b/,
      /\bpuk(i|1)m(a|4)k?\b/,
      /\bp(e|3)ld(e|3)s?\b/,
      /\bjanc(ok|uck|uk)\b/,
      /\bjnck?\b/,
      /\bcok\b/,
      /\bc0k\b/,
      /\bbabi\b/,
      /\bb4bi\b/,
      /\bkampr(et|it)\b/,
      /\bkmprt?\b/,
      /\bb(e|3)rk?\b/,
      /\bbrengsek\b/,
      /\bbrengse+k\b/,
      /\basuuu?\b/,
      /\basu\b/,
      /\bbajingan\b/,
      /\bb4jingan\b/,
      /\bsialan\b/,
      /\bs1alan\b/,
      /\blaknat\b/,
      /\bceleng\b/,

      // === MAKIAN HALUS TAPI TOXIC ===
      /\bkeparat\b/,
      /\bk3parat\b/,
      /\bbrengsek\b/,
      /\bsetan\b/,
      /\niblis\b/,
      /\bmonyet\b/,
      /\bm0nyet\b/,
      /\bbacot\b/,
      /\bb4cot\b/,
      /\bbacod\b/,
      /\bbodong\b/,
      /\btolol\b/,
      /\bt0lol\b/,
      /\btelol\b/,
      /\bidiot\b/,
      /\bid1ot\b/,
      /\bbloon\b/,
      /\bbl0on\b/,
      /\bdungu\b/,
      /\bd4ngu\b/,
      /\bling(lung|leng)?\b/,

      // === SERANGAN PERSONAL ===
      /\bjelek\b/,
      /\bburuk\b/,
      /\bmiskin\b/,
      /\bm1skin\b/,
      /\bgembel\b/,
      /\bg3mbel\b/,
      /\bpengemis\b/,
      /\bpengem1s\b/,
      /\bjompo\b/,
      /\bgila\b/,
      /\bg1la\b/,
      /\bedan\b/,
      /\bstres\b/,
      /\bstr3s\b/,
      /\bsinting\b/,

      // === KATA BYPASS UMUM ANAK INDONESIA ===
      /\bwkwkwk.*(?:anjir|bangsat|goblok)\b/,
      /\ba+n+j+\b/,           // aannnjj
      /\bb+g+s+t?\b/,         // bbggss
      /\bg+b+l+k?\b/,         // ggbbll
      /\bj+n+c+k?\b/,         // jjnncc
      /\bc+n+t+l?\b/,         // ccnntt (kontol disingkat)
      /\bmmk\b/,              // memek disingkat
      /\bpkm[ak]?\b/,         // pukimak disingkat

      // === TOXIC BEHAVIOR (ancaman/hinaan konteks) ===
      /\bpukul\s*(lo|lu|kamu|elu)\b/,
      /\bhajar\s*(lo|lu|kamu|elu)\b/,
      /\bgebuk\s*(lo|lu|kamu|elu)\b/,
      /\bbunuh\s*(lo|lu|kamu|diri)\b/,
      /\bmati\s*(lo|lu|kamu|elu|aja)\b/,
      /\bm4ti\b/,
      /\bmatiin\b/,
    ];

    // Cek apakah ada kata toxic yang cocok
    const isToxic = toxicPatterns.some(pattern => pattern.test(cleaned));
    if (!isToxic) return;

    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNum = senderJid?.split('@')[0].split(':')[0];

    // Update jumlah warning
    if (!db.antitoxic[groupId].warnings[senderNum]) {
      db.antitoxic[groupId].warnings[senderNum] = 0;
    }
    db.antitoxic[groupId].warnings[senderNum]++;
    const totalWarning = db.antitoxic[groupId].warnings[senderNum];

    try {
      // Hapus pesan toxic
      await sock.sendMessage(groupId, {
        delete: m.key
      });
    } catch (_) {}

    // Kirim peringatan
    await sock.sendMessage(groupId, {
      text:
`⚠️ *WARNING! TOXIC TERDETEKSI!*

🚫 Dilarang toxic disini!! @${senderNum}
⚡ Jika kamu keterusan toxic maka bakal kena tindak oleh admin!

📊 Catatan toxic: *${totalWarning}x*`,
      mentions: [senderJid]
    });
  }
};
