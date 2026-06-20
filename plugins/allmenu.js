export default {
  command: ['allmenu', 'menu'],
  category: 'main',
  description: 'Menampilkan semua menu',
  owner: true,

  async execute({ m }) {

    m.reply(
`╭───〔 🤖 XZEERH DEV MENU 〕───⬣

👑 OWNER MENU
⭔ .ping
⭔ .allmenu

👥 GROUP MENU
⭔ .open
⭔ .close
⭔ .hidetag
⭔ .tagall

👋 WELCOME & GOODBYE
⭔ .setwelcome
⭔ .setout

🛡️ SECURITY MENU
⭔ .antikudeta
⭔ .addkebal
⭔ .delkebal
⭔ .listkebal
⭔ .cekkebal

📊 BOT INFO
⭔ Mode : Self
⭔ Status : Online
⭔ Version : 1.0

╰────────────⬣

© XZEERH DEV`
    );

  }
};