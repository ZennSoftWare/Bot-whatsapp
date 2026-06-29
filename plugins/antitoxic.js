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

    // ============================================================
    // NORMALISASI — Hapus semua trik bypass
    // ============================================================
    const normalize = (str) => {
      let s = str.toLowerCase();

      // Ganti karakter unicode mirip huruf latin (leet speak & lookalike)
      const charMap = {
        'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'a',
        'è':'e','é':'e','ê':'e','ë':'e',
        'ì':'i','í':'i','î':'i','ï':'i',
        'ò':'o','ó':'o','ô':'o','õ':'o','ö':'o','ø':'o',
        'ù':'u','ú':'u','û':'u','ü':'u',
        'ý':'y','ÿ':'y',
        'ñ':'n','ç':'c','ß':'ss',
        // Leet speak angka
        '0':'o','1':'i','3':'e','4':'a','5':'s','6':'g','7':'t','8':'b','9':'g',
        // Simbol pengganti huruf
        '@':'a','$':'s','!':'i','+':'t','#':'h','&':'and',
        '|':'i','(':'c',')':'o',
        // Karakter fullwidth
        'ａ':'a','ｂ':'b','ｃ':'c','ｄ':'d','ｅ':'e','ｆ':'f','ｇ':'g',
        'ｈ':'h','ｉ':'i','ｊ':'j','ｋ':'k','ｌ':'l','ｍ':'m','ｎ':'n',
        'ｏ':'o','ｐ':'p','ｑ':'q','ｒ':'r','ｓ':'s','ｔ':'t','ｕ':'u',
        'ｖ':'v','ｗ':'w','ｘ':'x','ｙ':'y','ｚ':'z',
      };

      s = s.split('').map(c => charMap[c] || c).join('');

      // Hapus karakter non-alfanumerik kecuali spasi (strip tanda baca, emoji, dll)
      s = s.replace(/[^\w\s]/g, '');

      // Hilangkan huruf berulang lebih dari 2x (bodohhh → bodoh, anjirrrr → anjir)
      s = s.replace(/(.)\1{2,}/g, '$1$1');

      // Hapus spasi di antara huruf yang dipisah (b o d o h → bodoh)
      s = s.replace(/\b(\w)\s+(?=(\w\s)*\w\b)/g, '$1');

      // Normalisasi spasi
      s = s.replace(/\s+/g, ' ').trim();

      return s;
    };

    const cleaned = normalize(text);

    // ============================================================
    // KATEGORI 1: MAKIAN UMUM
    // ============================================================
    const makianUmum = [
      /\banj(ir|ing|eng|ay|i+|e+|u+)?\b/,
      /\banz\b/, /\bannj\b/, /\bannjir\b/,
      /\bb(a|o)d(o+h?|0+h?)\b/,
      /\bbgst?\b/, /\bbangsat\b/, /\bbgsd\b/,
      /\bgoblo+k\b/, /\bgo+bl?\b/, /\bgblk\b/,
      /\bng?entot\b/, /\bntot\b/, /\bentod\b/,
      /\bkontol\b/, /\bkntl\b/, /\bk0nt0l\b/, /\bkotol\b/,
      /\bmemek\b/, /\bmmk\b/, /\bm3m3k\b/, /\bpepek\b/,
      /\bpukimak\b/, /\bpkm[ak]?\b/, /\bpukim\b/,
      /\bpeldes\b/, /\bpld\b/,
      /\bjanc(ok|uk|uck)\b/, /\bjnck?\b/, /\bjancuk\b/,
      /\bcok\b/, /\bc0k\b/, /\bcoeg\b/,
      /\bbabi\b/, /\bb4bi\b/,
      /\bkampr(et|it)\b/, /\bkmprt?\b/,
      /\bbrengsek\b/, /\bbrengsk\b/,
      /\basuuu?\b/, /\basu\b/, /\basuu\b/,
      /\bbajingan\b/, /\bbjngn\b/,
      /\bsialan\b/, /\bsial\b/,
      /\blaknat\b/, /\bceleng\b/,
      /\bkeparat\b/, /\bkprt\b/,
      /\bsetan\b/, /\niblis\b/,
      /\bmonyet\b/, /\bmnyt\b/,
      /\bbacot\b/, /\bbcot\b/, /\bbacod\b/,
      /\btolol\b/, /\bt0lol\b/, /\btelol\b/, /\btlol\b/,
      /\bidiot\b/, /\bid10t\b/,
      /\bbloon\b/, /\bbl0on\b/,
      /\bdungu\b/, /\bdngu\b/,
      /\bgila\b/, /\bedan\b/, /\bsinting\b/,
      /\bstres\b/, /\bstr3s\b/,
      /\bweteng\b/, /\bndasmu\b/, /\bndas\b/,
      /\bjembut\b/, /\bjmbt\b/,
      /\bnj(ir|ing)?\b/,
      /\bkont(ol|l)\b/,
      /\bbodong\b/,
    ];

    // ============================================================
    // KATEGORI 2: PENGHINAAN KELUARGA
    // ============================================================
    const penghijaanKeluarga = [
      /\bibu?\s*(mu|lo|lu|kamu|elu|nya)?\s*(anjing|babi|bangsat|goblok|kontol|memek|pelacur|jalang|murahan|brengsek)\b/,
      /\bbokap\s*(mu|lo|lu|kamu|elu|nya)?\s*(anjing|babi|bangsat|goblok)\b/,
      /\bortu\s*(mu|lo|lu|kamu|elu|nya)?\s*(anjing|babi|bangsat)\b/,
      /\bnyokap\s*(mu|lo|lu|kamu|elu|nya)?\s*(anjing|babi|bangsat|jalang)\b/,
      /\b(mama|ibu|bapak|ayah|bokap|nyokap)\s*(lo|lu|mu|kamu|elu)\s*(pelacur|jalang|murahan|lacur)\b/,
      /\banak\s*(haram|jadah|sundal)\b/,
      /\bharam\s*jadah\b/,
      /\bsundal\b/,
      /\bpelacur\b/, /\bplcr\b/,
      /\bjalang\b/,
      /\blacur\b/,
      /\bsundel\b/,
      /\bnajis\s*(lo|lu|kamu)\b/,
    ];

    // ============================================================
    // KATEGORI 3: PENGHINAAN FISIK / BODY SHAMING
    // ============================================================
    const bodyShaming = [
      /\b(muka|wajah)\s*(jelek|buruk|hancur|rusak|kayak\s*tai|kayak\s*sampah)\b/,
      /\bjelek\s*(banget|bgt|pake\s*bgt|amat)\b/,
      /\bitem\s*(banget|bgt|amat|pake\s*bgt)\b/,
      /\bhitam\s*pekat\b/,
      /\bgendut\s*(banget|bgt|amat|pake\s*bgt|lo|lu|kamu)\b/,
      /\bgemuk\s*(banget|bgt|amat)\b/,
      /\bkurus\s*(banget|bgt|amat|kayak\s*tulang)\b/,
      /\bpendek\s*(banget|bgt|amat|lo|lu|kamu)\b/,
      /\bbocah\s*(jelek|culun|gembel|miskin)\b/,
      /\bcacad?\b/,
      /\bdifabel\b.*\bhinaan\b/,
      /\bjompo\b/,
      /\brongsokan\b/,
      /\bburik\b/,
      /\bjerawatan\b.*\bjelek\b/,
      /\bhidung\s*(pesek|gede|jelek)\b/,
      /\bmata\s*(sipit|juling|jelek)\b/,
      /\bbibir\s*(tebal|jelek)\b/,
    ];

    // ============================================================
    // KATEGORI 4: PENGHINAAN INTELEKTUAL
    // ============================================================
    const penghijaanIntelektual = [
      /\boo+n\b/,
      /\bbego\b/, /\bbg0\b/,
      /\bkurang\s*ajar\b/,
      /\btidak\s*(punya\s*otak|punya\s*akal|waras)\b/,
      /\bgak\s*(punya\s*otak|punya\s*akal|waras)\b/,
      /\botak\s*(lo|lu|mu|kamu|elu)?\s*(mana|kemana|di\s*mana|kosong|cemen)\b/,
      /\bnggak\s*waras\b/,
      /\bgak\s*waras\b/,
      /\btidak\s*waras\b/,
      /\bnirwana\b.*\botak\b/,
      /\bdbodoh\b/,
      /\bbodoh\b/,
      /\btolol\b/,
      /\bpayah\b.*\b(lo|lu|kamu|elu)\b/,
      /\blemah\b.*\b(lo|lu|kamu|elu)\b/,
      /\bgak\s*ada\s*gunanya\b/,
      /\btidak\s*ada\s*gunanya\b/,
      /\bsampah\s*(lo|lu|kamu|elu|masyarakat)\b/,
      /\buangkin\b/,
    ];

    // ============================================================
    // KATEGORI 5: PELECEHAN SEKSUAL
    // ============================================================
    const pelecaanSeksual = [
      /\bsex\b/, /\bseks\b/, /\bseksi\b.*\bpaksa\b/,
      /\bperkosa\b/, /\bprksa\b/,
      /\bcabul\b/,
      /\bmesum\b/,
      /\bbugil\b/,
      /\btelanjang\b.*\b(paksa|kirim|foto|video)\b/,
      /\bbokep\b/, /\bporno\b/,
      /\bmasturbasi\b/, /\bonani\b/,
      /\bcoli\b/, /\bcol\b.*\b(yuk|dong|ayo)\b/,
      /\bmeki\b/,
      /\bbispak\b/,
      /\bnakal\b.*\bayuk\b/,
      /\bkirim\s*(foto|video|konten)\s*(hot|bugil|telanjang|nakal|dewasa)\b/,
      /\bbody\s*lo\s*(mantap|seksi|hot)\b/,
      /\bML\b/, /\bbercinta\b.*\bpaksa\b/,
    ];

    // ============================================================
    // KATEGORI 6: UJARAN KEBENCIAN & DISKRIMINASI SARA
    // ============================================================
    const ujaranKebencian = [
      // Suku
      /\b(orang|si|lo|lu|kamu)\s*(jawa|sunda|batak|papua|ambon|madura|betawi)\s*(jelek|bodoh|bau|miskin|primitif|kampungan|kotor)\b/,
      /\bpribumi\s*(rendah|bodoh|primitif)\b/,
      /\bpendatang\s*(pulang|pergi|minggat)\b/,
      /\b(cina|china|chinese|tionghoa)\s*(pelit|penipu|anjing|jelek|minggat|pulang)\b/,
      /\barab\s*(penipu|teroris|minggat|pulang)\b/,
      /\bbule\s*(bodoh|bangsat|minggat)\b/,
      // Agama
      /\b(islam|kristen|katolik|hindu|budha|yahudi)\s*(sesat|kafir|hina|jelek|teroris|laknat)\b/,
      /\bkafir\b.*\b(hina|rendah|bunuh)\b/,
      /\bmusyrik\b.*\bhina\b/,
      /\btuhan\s*(lo|lu|mu|kamu)\s*(palsu|bohong|gak\s*ada)\b/,
      /\bagama\s*(lo|lu|mu|kamu)\s*(sesat|jelek|salah|hina)\b/,
      // Ras
      /\bkulit\s*(hitam|gelap)\s*(jelek|bau|kotor|primitif)\b/,
      /\bbangsa\s*(rendah|hina|kotor|primitif)\b/,
      // Gender
      /\bbanci\b/, /\bwaria\b.*\bhina\b/, /\btransgender\b.*\bhina\b/,
      /\blgbt\b.*\b(hina|sesat|sampah|bunuh)\b/,
      /\bcowok\s*(banci|bencong|lemah)\b/,
      /\bcewek\s*(gak\s*berguna|dapur\s*aja|kodrat)\b/,
    ];

    // ============================================================
    // KATEGORI 7: ANCAMAN KEKERASAN
    // ============================================================
    const ancamanKekerasan = [
      /\b(aku|gw|gue|saya)\s*(mau|akan|bakal|siap)\s*(bunuh|hajar|pukul|gebuk|bacok|tikam|tembak|siksa)\s*(lo|lu|kamu|elu|kalian|dia)\b/,
      /\b(bunuh|hajar|pukul|gebuk|bacok|siksa)\s*(lo|lu|kamu|elu|kalian)\b/,
      /\bmati\s*(lo|lu|kamu|elu|aja|deh|sana)\b/,
      /\bmatiin\b/,
      /\bm4ti\b/,
      /\bbiar\s*mati\b/,
      /\bawas\s*(lo|lu|kamu|elu)\b/,
      /\bjangan\s*sampe\s*ketemu\b/,
      /\bkalo\s*ketemu\b.*\bhabis\b/,
      /\bnanti\s*(gw|aku|saya)\s*(urusin|habisin|sikat)\b/,
      /\blapor(in)?\s*(ke\s*)?(polisi|ortu|guru)\b.*\bawas\b/,
      /\bbakar\s*(rumah|motor|mobil)\s*(lo|lu|kamu)\b/,
      /\bserang\b.*\b(lo|lu|kamu|elu|kalian)\b/,
      /\bhabis(in)?\s*(lo|lu|kamu|elu)\b/,
    ];

    // ============================================================
    // KATEGORI 8: PROVOKASI
    // ============================================================
    const provokasi = [
      /\badu\s*domba\b/,
      /\bprovokasi\b/,
      /\bhasut\b/,
      /\bfitnah\b/,
      /\bbohong\b.*\b(nyebarin|sebar|share)\b/,
      /\bsebar\s*(hoax|hoaks|bohong|fitnah)\b/,
      /\bjangan\s*(percaya|percay4)\s*(dia|mereka|admin)\b/,
      /\bkumpulin\s*(massa|orang|pasukan)\b/,
      /\bgerakan\b.*\b(turun|lawan|demo)\b/,
      /\bbuat\s*(grup|kelompok)\s*(tandingan|lawan)\b/,
    ];

    // ============================================================
    // KATEGORI 9: BULLYING & CYBERBULLYING
    // ============================================================
    const bullying = [
      /\b(lo|lu|kamu|elu)\s*(gak\s*ada\s*teman|tidak\s*punya\s*teman|sendirian\s*terus)\b/,
      /\b(lo|lu|kamu|elu)\s*(gak\s*disukai|dibenci|gak\s*diterima)\b/,
      /\b(lo|lu|kamu)\s*(mending\s*gak\s*usah\s*ada|gak\s*perlu\s*ada|gak\s*penting)\b/,
      /\bmending\s*lenyap\b/,
      /\bpergi\s*aja\s*(sana|deh|lo|lu)\b/,
      /\bblock\s*(aja|deh)\s*(lo|lu|dia)\b/,
      /\breport\s*(massal|rame\s*rame)\b/,
      /\bspam\s*(mention|tag|pesan)\b/,
      /\bflood\b/,
      /\bkirim\s*(virus|malware|link\s*phising|link\s*berbahaya)\b/,
      /\bhack\s*(akun|hp|wa|whatsapp)\s*(lo|lu|kamu|dia)\b/,
      /\bdoxxing\b/,
      /\bsebar\s*(alamat|nomor|data\s*pribadi)\s*(lo|lu|dia|kamu)\b/,
      /\bsebar\s*(foto|video)\s*(pribadi|mesum|hot|bugil)\b/,
      /\bpermalukan\b/,
      /\bpermaluin\b/,
      /\bmempermalukan\b/,
    ];

    // ============================================================
    // KATEGORI 10: SPAM TOXIC
    // ============================================================
    const spamToxic = [
      // Pesan berulang yang sama 3x atau lebih (akan ditangani via collapsed repeat check)
      /(.{5,})\1{2,}/, // konten berulang
    ];

    // ============================================================
    // ANTI-BYPASS TAMBAHAN: Pola obfuskasi canggih
    // ============================================================
    const antiBypass = [
      // Huruf disisip titik/strip: a.n.j.i.r, a-n-j-i-r
      /a[\.\-_\*]?n[\.\-_\*]?j[\.\-_\*]?[iy]?[\.\-_\*]?r?\b/,
      /b[\.\-_\*]?[ao][\.\-_\*]?d[\.\-_\*]?[oe][\.\-_\*]?h?\b/,
      /g[\.\-_\*]?[oe][\.\-_\*]?b[\.\-_\*]?l[\.\-_\*]?[oe][\.\-_\*]?k?\b/,
      /b[\.\-_\*]?a[\.\-_\*]?n[\.\-_\*]?g[\.\-_\*]?s[\.\-_\*]?a[\.\-_\*]?t\b/,
      /k[\.\-_\*]?[oe][\.\-_\*]?n[\.\-_\*]?t[\.\-_\*]?[oe][\.\-_\*]?l?\b/,
      /j[\.\-_\*]?a[\.\-_\*]?n[\.\-_\*]?c[\.\-_\*]?[ou][\.\-_\*]?k?\b/,
      /p[\.\-_\*]?u[\.\-_\*]?k[\.\-_\*]?i[\.\-_\*]?m[\.\-_\*]?a[\.\-_\*]?k?\b/,
      // Singkatan canggih
      /\bnjr\b/, /\bnjr\b/, /\bnjg\b/,
      /\bbgst\b/, /\bbgs\b.*\b(hina|toxic|kasar)\b/,
      /\bgbl\b/, /\bgblk\b/,
      /\bktl\b/, /\bkntl\b/,
      /\bjnc\b/, /\bjncok\b/,
      /\bmmk\b/, /\bmpk\b/,
      /\basu\b/, /\bass\b.*\b(lo|lu|kamu)\b/,
      // Spasi kreatif
      /k\s*o\s*n\s*t\s*o\s*l/,
      /a\s*n\s*j\s*i\s*r/,
      /b\s*o\s*d\s*o\s*h/,
      /g\s*o\s*b\s*l\s*o\s*k/,
      /b\s*a\s*n\s*g\s*s\s*a\s*t/,
      /m\s*e\s*m\s*e\s*k/,
      /j\s*a\s*n\s*c\s*o\s*k/,
    ];

    // ============================================================
    // CEK SEMUA KATEGORI
    // ============================================================
    const semuaPattern = [
      ...makianUmum,
      ...penghijaanKeluarga,
      ...bodyShaming,
      ...penghijaanIntelektual,
      ...pelecaanSeksual,
      ...ujaranKebencian,
      ...ancamanKekerasan,
      ...provokasi,
      ...bullying,
      ...spamToxic,
    ];

    // Cek di teks yang sudah dinormalisasi
    const isToxicCleaned = semuaPattern.some(p => p.test(cleaned));

    // Cek anti-bypass di teks ASLI (sebelum dinormalisasi) untuk tangkap obfuskasi
    const rawLower = text.toLowerCase();
    const isToxicRaw = antiBypass.some(p => p.test(rawLower));

    if (!isToxicCleaned && !isToxicRaw) return;

    const senderJid = m.key.participant || m.key.remoteJid;
    const senderNum = senderJid?.split('@')[0].split(':')[0];

    if (!db.antitoxic[groupId].warnings[senderNum]) {
      db.antitoxic[groupId].warnings[senderNum] = 0;
    }
    db.antitoxic[groupId].warnings[senderNum]++;
    const totalWarning = db.antitoxic[groupId].warnings[senderNum];

    try {
      await sock.sendMessage(groupId, { delete: m.key });
    } catch (_) {}

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
