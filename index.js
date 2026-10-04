const TelegramBot = require('node-telegram-bot-api');

// Aapki Final Details
const token = '8301838001:AAEKozR1IdOO07d8JRuWZ_BNZwd9GZaESZg';
const webAppUrl = 'https://airdropnewmera.vercel.app/'; 
const botUsername = 'USDTGalaxyProRobot'; 
const adminId = 7813148563; 

const paymentChannel = '@usdt_GalaxyPayments'; 

const bot = new TelegramBot(token, {polling: true});

// Modern Main Menu
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

// Start Command Handling (Direct Main Menu, No Check)
bot.onText(/\/start(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;

    const refParam = match[1].trim();
    if (refParam && refParam != userId) {
        bot.sendMessage(chatId, `✨ Welcome aboard! Invited by ID: ${refParam}`);
    }

    // Direct welcome message bina kisi check ke
    bot.sendMessage(chatId, `🚀 **Welcome to USDT Galaxy, ${userName}!**\n\nYour account is active. Use the terminal below to navigate your dashboard.`, { parse_mode: "Markdown", ...mainMenu });
});

// Main Menu Button Clicks (No Check)
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    if (!text || text.startsWith('/start')) return;

    if (text === '/admin' && userId === adminId) {
        bot.sendMessage(chatId, `🛠 **Admin Panel:**\nBot is running perfectly!\nForce Subscribe is currently OFF.`);
        return;
    }

    if (text === "🌌 My Profile") {
        bot.sendMessage(chatId, `👤 **Commander Profile**\n\n🪙 **Galaxy Tokens:** 500\n💵 **USDT Value:** ≈ $0.05\n\n*Status: Active*`, { parse_mode: "Markdown" });
    }
    else if (text === "🛸 Invite Crew") {
        const refLink = `https://t.me/${botUsername}?start=${userId}`;
        bot.sendMessage(chatId, `🛸 **Recruit & Earn**\n\nBuild your crew! Earn **100 GALAXY ($0.01 USDT)** for every valid recruit.\n\n🚀 Your Transmission Link:\n\`${refLink}\``, { parse_mode: "Markdown" });
    }
    else if (text === "💳 Payout (USDT)") {
        bot.sendMessage(chatId, `🏦 **USDT Treasury (BEP-20)**\n\n🔒 **Threshold:** 700 GALAXY ($0.07 USDT)\n\nYou need 200 more GALAXY to unlock the withdrawal portal.\n\n🧾 **Live Payout Proofs:** ${paymentChannel}`);
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

console.log("USDT Galaxy Bot is running (Channel Check OFF)...");
