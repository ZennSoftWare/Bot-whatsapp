import fs from 'fs';
import path from 'path';

export default {
  command: ['cleansession', 'cleansess'],
  category: 'owner',
  owner: true,

  async execute({ sock, m, db }) {
    const jid = m.key.remoteJid;

    // Sesuaikan nama folder session bot kamu
    const sessionDir = path.join(process.cwd(), 'session');

    // Validasi keberadaan folder session
    if (!fs.existsSync(sessionDir)) {
      return m.reply(
`❌ *SESSION CLEANER FAILED!*

╭╼─┈─┈──⏣╼╯
│Folder sesi tidak ditemukan di path:
│📂 \`${sessionDir}\`
╰─╼─┈─┈─┈`
      );
    }

    // Kirim react + pesan loading
    await sock.sendMessage(jid, { react: { text: '🧹', key: m.key } });

    const loadingMsg = await sock.sendMessage(jid, {
      text:
`🧹 *SESSION CLEANER XZEERHBOT...*

╭╼─┈─┈──⏣╼╯
│[⏳] Memindai folder \`session\`...
│[  ] Menyapu bersih file sampah pre-keys & sender-keys...
│[  ] Menghilangkan file temporary sisa render...
╰─╼─┈─┈─┈`
    }, { quoted: m });

    try {
      const files = fs.readdirSync(sessionDir);
      let deletedFilesCount = 0;
      let totalSizeDeleted = 0;

      // File utama yang WAJIB dilindungi agar tidak logout!
      const protectedFiles = [
        'creds.json',
        'creds',
        '.gitkeep'
      ];

      for (const file of files) {
        const filePath = path.join(sessionDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) continue;

        // Proteksi mutlak file login utama
        if (protectedFiles.includes(file) || file.startsWith('creds')) continue;

        // Deteksi file sampah Baileys
        const isBaileysTrash = (
          file.startsWith('pre-key-') ||
          file.startsWith('sender-key-') ||
          file.startsWith('session-') ||
          file.startsWith('app-state-sync-key-') ||
          file.startsWith('app-state-sync-version-')
        );

        // Deteksi file temporary sisa render crash
        const isTempTrash = (
          file.startsWith('tmp_') ||
          file.endsWith('.tmp') ||
          file.endsWith('.exif')
        );

        // Hapus file sampah (kecuali creds)
        if (isBaileysTrash || isTempTrash || (!file.startsWith('creds') && !protectedFiles.includes(file))) {
          totalSizeDeleted += stat.size;
          fs.unlinkSync(filePath);
          deletedFilesCount++;
        }
      }

      const sizeInKB = (totalSizeDeleted / 1024).toFixed(2);
      const sizeInMB = (totalSizeDeleted / (1024 * 1024)).toFixed(2);
      const readableSize = totalSizeDeleted > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`;

      // Edit pesan loading jadi hasil sukses
      await sock.sendMessage(jid, {
        text:
`✅ *SESSION CLEAN SUCCESS! — XZEERHBOT*

╭╼─┈─┈──⏣╼╯
│🧹 *Sesi & File Sampah Bersih Total!*
│
│• *Folder:* \`session\`
│• *File Terhapus:* ${deletedFilesCount} file
│• *Memori Dibebaskan:* 🎉 ${readableSize}
│• *Status Kredensial:* 🔒 Aman (creds.json dilindungi)
│
│> Folder sesi lo sekarang steril dan enteng lagi :3
╰─╼─┈─┈─┈`,
        edit: loadingMsg.key
      });

      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (err) {
      console.error('❌ CleanSession Error:', err);

      await sock.sendMessage(jid, {
        text:
`❌ *SESSION CLEANER FAILED! — XZEERHBOT*

╭╼─┈─┈──⏣╼╯
│Gagal membersihkan file sampah sesi!
│😿 *Error:* ${err.message}
╰─╼─┈─┈─┈`,
        edit: loadingMsg.key
      });

      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
    }
  }
};
