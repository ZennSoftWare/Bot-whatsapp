export default {
  command: ['allmenu', 'menu'],
  category: 'main',
  owner: true,

  async execute({ m }) {
    await m.reply(
`╭───〔 🤖 XZEERH BOT 〕───⬣

👋 Halo Owner!
Berikut daftar perintah yang tersedia:

━━━━━━━━━━━━━━
🏓 *MAIN MENU*
◇ .ping
◇ .statusbot
◇ .onlinebot
◇ .offlinebot

━━━━━━━━━━━━━━
👥 *GROUP MENU*
◇ .tagall
◇ .hidetag
◇ .kick @user
◇ .open
◇ .close

━━━━━━━━━━━━━━
🛡️ *SECURITY MENU*
◇ .antikudeta on/off
◇ .antilink on/off
◇ .addkebal @user
◇ .delkebal @user
◇ .listkebal
◇ .cekkebal @user

━━━━━━━━━━━━━━
👋 *WELCOME & GOODBYE*
◇ .setwelcome [pesan]
◇ .setout [pesan]

━━━━━━━━━━━━━━
📊 *BOT INFO*
◇ Mode   : Self
◇ Status : Online
◇ Version : 2.0

╰────────────⬣
© XZEERH DEV`
    );
  }
};