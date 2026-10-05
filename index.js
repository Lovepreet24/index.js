const TelegramBot = require('node-telegram-bot-api');
const http = require('http'); // Naya API server module

const token = '8301838001:AAEKozR1IdOO07d8JRuWZ_BNZwd9GZaESZg';
const webAppUrl = 'https://airdropnewmera.vercel.app/'; 
const botUsername = 'USDTGalaxyProRobot'; 
const paymentChannel = '@usdt_GalaxyPayments'; 

const bot = new TelegramBot(token, {polling: true});
const userBalances = {};

const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: "🌌 My Profile" }, { text: "🛸 Invite Crew" }],
            [{ text: "💳 Payout (USDT)" }, { text: "🎬 Watch & Earn", web_app: { url: webAppUrl } }]
        ],
        resize_keyboard: true,
        is_persistent: true
    }
};

bot.onText(/\/start(.*)/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;

    if (!userBalances[chatId]) {
        userBalances[chatId] = 500;
    }
    bot.sendMessage(chatId, `🚀 **Welcome to USDT Galaxy, ${userName}!**\n\nYour account is active. Use the terminal below to navigate your dashboard.`, { parse_mode: "Markdown", ...mainMenu });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/start')) return;

    let currentBal = userBalances[chatId] || 500;
    let usdtVal = (currentBal * 0.0001).toFixed(2);

    if (text === "🌌 My Profile") {
        bot.sendMessage(chatId, `👤 **Commander Profile**\n\n🪙 **Galaxy Tokens:** ${currentBal}\n💵 **USDT Value:** ≈ $${usdtVal}\n\n*Status: Active*`, { parse_mode: "Markdown" });
    }
    else if (text === "🛸 Invite Crew") {
        bot.sendMessage(chatId, `🛸 **Recruit & Earn**\n\nBuild your crew! Earn **100 GALAXY ($0.01 USDT)** for every valid recruit.\n\n🚀 Your Transmission Link:\n\`https://t.me/${botUsername}?start=${msg.from.id}\``, { parse_mode: "Markdown" });
    }
    else if (text === "💳 Payout (USDT)") {
        bot.sendMessage(chatId, `🏦 **USDT Treasury (BEP-20)**\n\n🪙 Your Balance: ${currentBal} GALAXY\n🔒 **Threshold:** 700 GALAXY ($0.07 USDT)\n\n🧾 **Live Payout Proofs:** ${paymentChannel}`);
    }
});

// ✅ BACKEND SERVER (Auto-Sync ke liye)
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'POST' && req.url === '/sync') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.userId && data.balance) {
                    userBalances[data.userId] = data.balance; // Balance Save!
                    
                    // User ko bot me confirmation message bhej do (Optional)
                    bot.sendMessage(data.userId, `🔄 **Auto-Sync:** Your balance is updated to ${data.balance} GALAXY in the system.`);
                    
                    res.writeHead(200); res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(400); res.end(JSON.stringify({ error: 'Missing data' }));
                }
            } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: 'Server error' })); }
        });
    } else {
        res.writeHead(404); res.end('Not found');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => { console.log(`Auto-Sync API Server running on port ${PORT}`); });
