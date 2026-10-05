const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const mongoose = require('mongoose');

// Aapka MongoDB Database Link
const mongoURI = 'mongodb+srv://bhullar241:Lovepreet241@bhullar.jjzhl1x.mongodb.net/galaxybot?retryWrites=true&w=majority&appName=Bhullar';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB Connected! Database is Live.'))
    .catch(err => console.error('❌ MongoDB Error:', err));

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 500 }
});
const User = mongoose.model('User', userSchema);

// 👇 Yahan aapka NAYA TOKEN set kar diya hai 👇
const token = '8368559467:AAEdHKIhvI10PyiwsQnMTU1aoDq4ND-KQ4g';
const webAppUrl = 'https://airdropnewmera.vercel.app/'; 
const botUsername = 'USDTGalaxyProRobot'; 
const paymentChannel = '@usdt_GalaxyPayments'; 

const bot = new TelegramBot(token, {polling: true});

function getMainMenu(userId) {
    return {
        reply_markup: {
            keyboard: [
                [{ text: "🌌 My Profile" }, { text: "🛸 Invite Crew" }],
                [{ text: "💳 Payout (USDT)" }, { text: "🎬 Watch & Earn", web_app: { url: `${webAppUrl}?userid=${userId}` } }]
            ],
            resize_keyboard: true,
            is_persistent: true
        }
    };
}

bot.onText(/\/start(.*)/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const userName = msg.from.first_name;

    try {
        let user = await User.findOne({ userId: chatId });
        if (!user) {
            user = new User({ userId: chatId, balance: 500 }); 
            await user.save();
        }
        bot.sendMessage(chatId, `🚀 **Welcome to USDT Galaxy, ${userName}!**\n\nYour account is active. Use the terminal below to navigate your dashboard.`, { parse_mode: "Markdown", ...getMainMenu(chatId) });
    } catch (err) {
        bot.sendMessage(chatId, "⚠️ Server error. Please try again.");
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text;

    if (!text || text.startsWith('/start')) return;

    try {
        let user = await User.findOne({ userId: chatId });
        let currentBal = user ? user.balance : 500;
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
    } catch (err) {
        console.error(err);
    }
});

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'POST' && req.url === '/sync') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                if (data.userId && data.balance) {
                    await User.findOneAndUpdate(
                        { userId: data.userId.toString() },
                        { balance: data.balance },
                        { new: true, upsert: true }
                    );
                    
                    bot.sendMessage(data.userId, `🔄 **Auto-Sync:** Your balance is permanently updated to ${data.balance} GALAXY in the database. ✅`);
                    
                    res.writeHead(200); res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(400); res.end(JSON.stringify({ error: 'Missing data' }));
                }
            } catch (e) { 
                res.writeHead(500); res.end(JSON.stringify({ error: 'Server error' })); 
            }
        });
    } else {
        res.writeHead(404); res.end('Not found');
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => { console.log(`Auto-Sync API Server running on port ${PORT}`); });
