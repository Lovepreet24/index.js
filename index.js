const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://bhullar241:Lovepreet241@bhullar.jjzhl1x.mongodb.net/galaxybot?retryWrites=true&w=majority&appName=Bhullar';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB Connected! Database is Live.'))
    .catch(err => console.error('❌ MongoDB Error:', err));

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 500 }
});
const User = mongoose.model('User', userSchema);

const token = '8996114363:AAFOEaiPOMxQqVMDgFF8TpCP7GiJKl_JS3Y';
const webAppUrl = 'https://airdropnewmera.vercel.app/'; 
const botUsername = 'USDTGalaxyProRobot'; 
const paymentChannel = '@usdt_GalaxyPayments'; 

// ⚡ Webhook mode (No Polling, No 409 Conflict ever!)
const bot = new TelegramBot(token);

// Render ka URL yahan auto-detect hoga ya aap apni Render URL dal sakte hain
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
    bot.setWebHook(`${RENDER_URL}/bot${token}`);
    console.log(`Webhook set to: ${RENDER_URL}/bot${token}`);
}

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

async function handleMessage(chatId, userName, text, userIdFromMsg) {
    try {
        let user = await User.findOne({ userId: chatId });
        if (!user) {
            user = new User({ userId: chatId, balance: 500 }); 
            await user.save();
        }

        if (!text || text.startsWith('/start')) {
            bot.sendMessage(chatId, `🚀 **Welcome to USDT Galaxy, ${userName}!**\n\nYour account is active. Use the terminal below to navigate your dashboard.`, { parse_mode: "Markdown", ...getMainMenu(chatId) });
            return;
        }

        let currentBal = user ? user.balance : 500;
        let usdtVal = (currentBal * 0.0001).toFixed(2);

        if (text === "🌌 My Profile") {
            bot.sendMessage(chatId, `👤 **Commander Profile**\n\n🪙 **Galaxy Tokens:** ${currentBal}\n💵 **USDT Value:** ≈ $${usdtVal}\n\n*Status: Active*`, { parse_mode: "Markdown" });
        }
        else if (text === "🛸 Invite Crew") {
            bot.sendMessage(chatId, `🛸 **Recruit & Earn**\n\nBuild your crew! Earn **100 GALAXY ($0.01 USDT)** for every valid recruit.\n\n🚀 Your Transmission Link:\n\`https://t.me/${botUsername}?start=${userIdFromMsg}\``, { parse_mode: "Markdown" });
        }
        else if (text === "💳 Payout (USDT)") {
            bot.sendMessage(chatId, `🏦 **USDT Treasury (BEP-20)**\n\n🪙 Your Balance: ${currentBal} GALAXY\n🔒 **Threshold:** 700 GALAXY ($0.07 USDT)\n\n🧾 **Live Payout Proofs:** ${paymentChannel}`);
        }
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ Server error. Please try again.");
    }
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is active and running via Webhook!');
        return;
    }

    // Telegram Webhook Endpoint
    if (req.method === 'POST' && req.url === `/bot${token}`) {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const update = JSON.parse(body);
                res.writeHead(200); res.end('OK');

                if (update.message) {
                    const msg = update.message;
                    const chatId = msg.chat.id.toString();
                    const userName = msg.from.first_name || 'Commander';
                    const text = msg.text;
                    const userIdFromMsg = msg.from.id;

                    await handleMessage(chatId, userName, text, userIdFromMsg);
                }
            } catch (e) {
                console.error('Webhook error:', e);
            }
        });
        return;
    }

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

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => { console.log(`Webhook Server running on port ${PORT}`); });
