export default {
  command: ['antikudeta'],
  category: 'group',
  owner: true,
  group: true,

  async execute({ m, args, db }) {
    if (!db.antikudeta) db.antikudeta = {};
    const groupId = m.key.remoteJid;

    if (typeof db.antikudeta[groupId] === 'boolean') {
      db.antikudeta[groupId] = { on: db.antikudeta[groupId], whitelist: [], recentPelaku: [] };
    }

    if (!args[0]) {
      const status = db.antikudeta[groupId]?.on ? 'ON ☠️' : 'OFF';
      return m.reply(
`Status anti kudeta grup ini : *${status}*

Contoh:
.antikudeta on
.antikudeta off`
      );
    }

    const arg = args[0].toLowerCase();
    if (arg === 'on') {
      if (!db.antikudeta[groupId] || typeof db.antikudeta[groupId] !== 'object') {
        db.antikudeta[groupId] = { on: false, whitelist: [], recentPelaku: [] };
      }
      db.antikudeta[groupId].on = true;
      return m.reply('☠️ Anti kudeta berhasil diaktifkan di grup ini.');
    }
    if (arg === 'off') {
      if (!db.antikudeta[groupId] || typeof db.antikudeta[groupId] !== 'object') {
        db.antikudeta[groupId] = { on: false, whitelist: [], recentPelaku: [] };
      }
      db.antikudeta[groupId].on = false;
      return m.reply('☠️ Anti kudeta berhasil dimatikan di grup ini.');
    }
  },

  async onParticipantsUpdate({ sock, id, participants, action, author, db }) {
    if (!db.antikudeta) db.antikudeta = {};

    if (typeof db.antikudeta[id] === 'boolean') {
      db.antikudeta[id] = { on: db.antikudeta[id], whitelist: [], recentPelaku: [] };
    }

    if (!db.antikudeta[id]) db.antikudeta[id] = { on: false, whitelist: [], recentPelaku: [] };
    if (!db.antikudeta[id].on) return;
    if (!db.antikudeta[id].recentPelaku) db.antikudeta[id].recentPelaku = [];

    if (action !== 'demote' && action !== 'remove') return;
    if (!author) return;

    const target = participants?.[0];
    const actor = author;
    if (!target || !actor) return;

    const getNum = (jid) => jid?.split('@')[0].split(':')[0];
    const botPhone = getNum(sock.user.id);
    const ownerNum = getNum(db.ownerNum) || botPhone;

    // ✅ SELF-LEARNING: Fetch metadata sekali, gunakan untuk segalanya
    // Ini dilakukan PERTAMA sebelum semua pengecekan
    let allParticipants;
    try {
      const metadata = await sock.groupMetadata(id);
      allParticipants = metadata.participants;
    } catch (e) {
      console.log('antikudeta error fetch metadata:', e.message);
      return;
    }

    // ✅ SELF-LEARNING: Pelajari semua kemungkinan ID bot dari metadata
    // Simpan ke db agar tidak perlu lookup berulang
    if (!db.botFullId || !db.botLid) {
      for (const p of allParticipants) {
        const pPhone = getNum(p.id);
        if (pPhone === botPhone) {
          if (!db.botFullId) db.botFullId = p.id;
          if (!db.botLid && p.lid) db.botLid = p.lid;
          break;
        }
      }
    }

    // ✅ CORE: Fungsi cek apakah JID adalah bot
    // Menggunakan semua ID yang diketahui: phone, fullId, lid, sock.user.lid
    const isBotJid = (jid) => {
      if (!jid) return false;
      // Cek via nomor HP (untuk @s.whatsapp.net)
      if (getNum(jid) === botPhone) return true;
      // Cek via db.botFullId (@s.whatsapp.net dari metadata)
      if (db.botFullId && jid === db.botFullId) return true;
      // Cek via db.botLid (@lid dari metadata p.lid)
      if (db.botLid && jid === db.botLid) return true;
      // Cek via sock.user.lid (kalau Baileys support)
      if (sock.user?.lid && jid === sock.user.lid) return true;
      if (sock.user?.lid && getNum(jid) === getNum(sock.user.lid)) return true;
      return false;
    };

    // ✅ TAMBAHAN: Cek via p.lid di allParticipants
    // Kalau jid adalah @lid, cari di metadata siapa yang punya p.lid = jid itu
    // lalu cek apakah p.id-nya adalah bot
    const isBotViaLid = (jid) => {
      if (!jid || !jid.includes('@lid')) return false;
      for (const p of allParticipants) {
        if (p.lid === jid) {
          // Ketemu participant yang punya @lid ini
          if (getNum(p.id) === botPhone) return true;
          if (db.botFullId && p.id === db.botFullId) return true;
        }
      }
      return false;
    };

    const isOwnerJid = (jid) => {
      if (!jid) return false;
      if (getNum(jid) === ownerNum) return true;
      return false;
    };

    const isProtected = (jid) => isBotJid(jid) || isBotViaLid(jid) || isOwnerJid(jid);

    // ✅ Skip langsung sebelum apapun
    if (isProtected(actor)) return;
    if (isProtected(target)) return;

    const actorNum = getNum(actor);
    const targetNum = getNum(target);

    // Cek recentPelaku
    if (action === 'demote') {
      const recentPelaku = db.antikudeta[id].recentPelaku;
      if (recentPelaku.includes(targetNum)) {
        db.antikudeta[id].recentPelaku = recentPelaku.filter(n => n !== targetNum);
        return;
      }
    }

    // Cek whitelist dan addkebal
    const whitelist = db.antikudeta[id]?.whitelist || [];
    const daftarKebal = db.kebal?.[id] || [];

    const isJidMatch = (jidA, jidB) => {
      if (!jidA || !jidB) return false;
      if (jidA === jidB) return true;
      return getNum(jidA) === getNum(jidB);
    };

    if (whitelist.some(j => isJidMatch(j, actor))) return;
    if (daftarKebal.some(j => isJidMatch(j, actor))) return;

    // Resolve actor dan target ke @s.whatsapp.net via metadata
    const resolveJid = (jid) => {
      for (const p of allParticipants) {
        if (p.id === jid) return p.id;
        if (getNum(p.id) === getNum(jid)) return p.id;
        if (p.lid && p.lid === jid) return p.id;
      }
      return null;
    };

    const actorJid = resolveJid(actor) || actor;
    const targetJid = resolveJid(target) || target;

    // Cek ulang setelah resolve
    if (isProtected(actorJid)) return;
    if (isProtected(targetJid)) return;

    if (whitelist.some(j => isJidMatch(j, actorJid))) return;
    if (daftarKebal.some(j => isJidMatch(j, actorJid))) return;

    const actorData = allParticipants.find(p => p.id === actorJid);
    if (!actorData) return;
    if (isProtected(actorData.id)) return;

    const targetData = allParticipants.find(p => p.id === targetJid);
    const actorNumFinal = getNum(actorData.id);
    const targetNumFinal = targetData ? getNum(targetData.id) : targetNum;

    if (action === 'demote') {
      if (targetData && targetNumFinal !== actorNumFinal) {
        await sock.groupParticipantsUpdate(id, [targetData.id], 'promote');
        await new Promise(r => setTimeout(r, 800));
      }
    }

    db.antikudeta[id].recentPelaku.push(actorNumFinal);
    setTimeout(() => {
      if (db.antikudeta[id]?.recentPelaku) {
        db.antikudeta[id].recentPelaku = db.antikudeta[id].recentPelaku.filter(n => n !== actorNumFinal);
      }
    }, 10000);

    await sock.groupParticipantsUpdate(id, [actorData.id], 'demote');
    await new Promise(r => setTimeout(r, 500));

    if (action === 'demote') {
      await sock.sendMessage(id, {
        text:
`⚠️ *ANTI KUDETA AKTIF!*

👤 @${actorNumFinal} mencoba demote admin @${targetNumFinal}
🔄 Admin dikembalikan
📉 Pelaku diturunkan!`,
        mentions: [actorData.id, ...(targetData ? [targetData.id] : [])]
      });
    } else if (action === 'remove') {
      await sock.sendMessage(id, {
        text:
`⚠️ *ANTI KUDETA AKTIF!*

👤 @${actorNumFinal} mencoba mengeluarkan anggota @${targetNumFinal}
📉 Pelaku diturunkan!`,
        mentions: [actorData.id]
      });
    }
  }
};
