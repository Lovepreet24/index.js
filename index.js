const TelegramBot = require('node-telegram-bot-api');

// Aapki Final Details
const token = '8301838001:AAEKozR1IdOO07d8JRuWZ_BNZwd9GZaESZg';
const webAppUrl = 'https://airdropnewmera.vercel.app/'; 
const botUsername = 'USDTGalaxyProRobot'; 
const adminId = 7813148563; 

// Channels
const mandatoryChannel = '@AirdropFindTeam'; 
const paymentChannel = '@usdt_GalaxyPayments'; // Naya Payment Channel

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

// Function: Channel Membership Check
async function checkMembership(userId) {
    try {
        const chatMember = await bot.getChatMember(mandatoryChannel, userId);
        if (['member', 'administrator', 'creator'].includes(chatMember.status)) {
            return true;
        }
        return false;
    } catch (error) {
        console.log("Error checking membership. Make sure Bot is admin in the channel.");
        return false;
    }
}

// Start Command Handling
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;

    const refParam = match[1].trim();
    if (refParam && refParam != userId) {
        bot.sendMessage(chatId, `✨ Welcome aboard! Invited by ID: ${refParam}`);
    }

    const isMember = await checkMembership(userId);

    if (isMember) {
        bot.sendMessage(chatId, `🚀 **Welcome to USDT Galaxy, ${userName}!**\n\nYour account is active. Use the terminal below to navigate your dashboard.`, { parse_mode: "Markdown", ...mainMenu });
    } else {
        const joinMenu = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Join Galaxy Channel", url: `https://t.me/${mandatoryChannel.replace('@', '')}` }],
                    [{ text: "✅ I Have Joined", callback_data: "check_join" }]
                ]
            }
        };
        bot.sendMessage(chatId, `🛑 **Access Denied**\n\nHello ${userName}, you must join our official channel to use this bot and earn USDT.\n\n1️⃣ Join ${mandatoryChannel}\n2️⃣ Click 'I Have Joined' to verify.`, { parse_mode: "Markdown", ...joinMenu });
    }
});

// Inline Button (Verify Join)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    if (query.data === 'check_join') {
        const isMember = await checkMembership(userId);
        
        if (isMember) {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, `✅ **Verification Successful!**\n\nWelcome to USDT Galaxy! Your dashboard is now unlocked.`, { parse_mode: "Markdown", ...mainMenu });
        } else {
            bot.answerCallbackQuery(query.id, { text: "❌ You haven't joined the channel yet!", show_alert: true });
        }
    }
});

// Main Menu Button Clicks
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    if (!text || text.startsWith('/start')) return;

    if (text === '/admin' && userId === adminId) {
        bot.sendMessage(chatId, `🛠 **Admin Panel:**\nBot is running perfectly!\nMain Channel: ${mandatoryChannel}\nPayment Channel:${paymentChannel}`);
        return;
    }

    const isMember = await checkMembership(userId);
    if (!isMember) {
        bot.sendMessage(chatId, `⚠️ You left the channel! Please join ${mandatoryChannel} to continue earning.`);
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
        // Yahan payment channel add kar diya gaya hai
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

console.log("USDT Galaxy Bot is running...");
          
