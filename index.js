const TelegramBot = require('node-telegram-bot-api');

const token = '8301838001:AAEKozR1IdOO07d8JRuWZ_BNZwd9GZaESZg';
const webAppUrl = 'https://airdropnewmera.vercel.app/'; 
const botUsername = 'USDTGalaxyProRobot'; 
const adminId = 7813148563; 
const paymentChannel = '@usdt_GalaxyPayments'; 

const bot = new TelegramBot(token, {polling: true});

// Har user ka balance store karne ke liye temporary memory
const userBalances = {};

const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: "🌌 My Profile" }, { text: "🛸 Invite Crew" }],
            [{ text: "💳 Payout (USDT)" }, { text: "🎬 Watch & Earn" }]
        ],
        resize_keyboard: true,
        is_persistent: true
    }
};

bot.onText(/\/start(.*)/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;

    // Default balance 500 agar pehli baar aaya hai
    if (!userBalances[chatId]) {
        userBalances[chatId] = 500;
    }

    bot.sendMessage(chatId, `🚀 **Welcome to USDT Galaxy, ${userName}!**\n\nYour account is active. Use the terminal below to navigate your dashboard.`, { parse_mode: "Markdown", ...mainMenu });
});

// Jab user mini app se balance sync karke wapas aayega
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Agar mini app se data aaya hai
    if (msg.web_app_data) {
        const newBalance = parseInt(msg.web_app_data.data);
        userBalances[chatId] = newBalance; // Balance update ho gaya!
        let usdtVal = (newBalance * 0.0001).toFixed(2);
        
        bot.sendMessage(chatId, `🎉 **Balance Synced Successfully!**\n\n🪙 New Balance: ${newBalance} GALAXY\n💵 USDT Value: ~$${usdtVal}`, { parse_mode: "Markdown", ...mainMenu });
        return;
    }

    if (!text || text.startsWith('/start')) return;

    // Current balance fetch karo
    let currentBal = userBalances[chatId] || 500;
    let usdtVal = (currentBal * 0.0001).toFixed(2);

    if (text === "🌌 My Profile") {
        bot.sendMessage(chatId, `👤 **Commander Profile**\n\n🪙 **Galaxy Tokens:** ${currentBal}\n💵 **USDT Value:** ≈ $${usdtVal}\n\n*Status: Active*`, { parse_mode: "Markdown" });
    }
    else if (text === "🛸 Invite Crew") {
        const refLink = `https://t.me/${botUsername}?start=${msg.from.id}`;
        bot.sendMessage(chatId, `🛸 **Recruit & Earn**\n\nBuild your crew! Earn **100 GALAXY ($0.01 USDT)** for every valid recruit.\n\n🚀 Your Transmission Link:\n\`${refLink}\``, { parse_mode: "Markdown" });
    }
    else if (text === "💳 Payout (USDT)") {
        bot.sendMessage(chatId, `🏦 **USDT Treasury (BEP-20)**\n\n🪙 Your Balance: ${currentBal} GALAXY\n🔒 **Threshold:** 700 GALAXY ($0.07 USDT)\n\n🧾 **Live Payout Proofs:** ${paymentChannel}`);
    }
    else if (text === "🎬 Watch & Earn") {
        const miniAppMenu = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "▶️ Open Galaxy Studio", web_app: { url: webAppUrl } }]
                ]
            }
        };
        bot.sendMessage(chatId, `📺 **Earn Instant Crypto**\n\nWatch transmissions (ads) in our secure Mini App to collect GALAXY tokens.`, miniAppMenu);
    }
});

console.log("USDT Galaxy Bot with Sync is running...");
