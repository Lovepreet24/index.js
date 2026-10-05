const TelegramBot = require("node-telegram-bot-api");
const http = require("http");
const crypto = require("crypto");

// =========================
// CONFIG
// =========================

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://uxunxwbmftxwqpfaoxhn.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "sb_secret_fjXt7879FvhhxPuEGyU1_Q_oKibdIMw";

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  "8996114363:AAG6KZtjbzgI8H7mceyKECWD5Yng29TXudQ";

const WEB_APP_URL =
  process.env.WEB_APP_URL ||
  "https://airdropnewmera.vercel.app/";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://usdtbot-production-89e9.up.railway.app";

const BOT_USERNAME =
  "USDTGalaxyProRobot";

const PAYMENT_CHANNEL =
  "@usdt_GalaxyPayments";

const STARTING_BALANCE = 500;
const EARN_AMOUNT = 100;


// =========================
// SAFETY
// =========================

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN missing");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}


// =========================
// TELEGRAM
// =========================

const bot =
  new TelegramBot(BOT_TOKEN);


// =========================
// SUPABASE
// =========================

async function supabaseRequest(path, options = {}) {

  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,

      headers: {
        apikey:
          SUPABASE_SERVICE_ROLE_KEY,

        Authorization:
          `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

        "Content-Type":
          "application/json",

        ...(options.headers || {})
      }
    }
  );


  const text =
    await response.text();

  let data = null;

  try {
    data =
      text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }


  if (!response.ok) {

    console.error(
      "Supabase error:",
      response.status,
      data
    );

    throw new Error(
      `Supabase ${response.status}`
    );
  }


  return data;
}


// =========================
// GET USER
// =========================

async function getUser(chatId) {

  const data =
    await supabaseRequest(
      `/rest/v1/users?chat_id=eq.${encodeURIComponent(
        chatId.toString()
      )}&select=*`
    );

  return (
    data &&
    data.length > 0
  )
    ? data[0]
    : null;
}


// =========================
// CREATE USER
// =========================

async function createUser(chatId) {

  try {

    const data =
      await supabaseRequest(
        "/rest/v1/users",
        {
          method: "POST",

          headers: {
            Prefer:
              "return=representation"
          },

          body: JSON.stringify({
            chat_id:
              chatId.toString(),

            balance:
              STARTING_BALANCE
          })
        }
      );


    return data &&
      data.length > 0
      ? data[0]
      : null;

  } catch (error) {

    console.error(
      "Create user error:",
      error
    );


    return await getUser(
      chatId
    );
  }
}


// =========================
// ENSURE USER
// =========================

async function ensureUser(chatId) {

  let user =
    await getUser(chatId);


  if (!user) {

    user =
      await createUser(chatId);
  }


  return user;
}


// =========================
// VERIFY TELEGRAM INIT DATA
// =========================

function verifyTelegramInitData(
  initData
) {

  if (
    !initData ||
    typeof initData !== "string"
  ) {
    return null;
  }


  try {

    const params =
      new URLSearchParams(
        initData
      );


    const receivedHash =
      params.get("hash");


    if (!receivedHash) {
      return null;
    }


    params.delete("hash");


    const dataCheckString =
      [...params.entries()]
        .sort(
          ([a], [b]) =>
            a.localeCompare(b)
        )
        .map(
          ([key, value]) =>
            `${key}=${value}`
        )
        .join("\n");


    const secretKey =
      crypto
        .createHmac(
          "sha256",
          "WebAppData"
        )
        .update(BOT_TOKEN)
        .digest();


    const calculatedHash =
      crypto
        .createHmac(
          "sha256",
          secretKey
        )
        .update(dataCheckString)
        .digest("hex");


    if (
      calculatedHash !==
      receivedHash
    ) {

      console.error(
        "Telegram hash mismatch"
      );

      return null;
    }


    const authDate =
      Number(
        params.get("auth_date")
      );


    if (!authDate) {
      return null;
    }


    const age =
      Math.floor(
        Date.now() / 1000
      ) - authDate;


    if (age > 86400) {

      console.error(
        "Telegram session expired"
      );

      return null;
    }


    const userString =
      params.get("user");


    if (!userString) {
      return null;
    }


    const telegramUser =
      JSON.parse(
        userString
      );


    if (!telegramUser.id) {
      return null;
    }


    return telegramUser;

  } catch (error) {

    console.error(
      "Telegram verification error:",
      error
    );

    return null;
  }
}


// =========================
// INLINE MINI APP BUTTON
// =========================

function getMiniAppButton() {

  return {
    reply_markup: {

      inline_keyboard: [

        [
          {
            text:
              "🎬 Watch & Earn",

            web_app: {
              url:
                WEB_APP_URL
            }
          }
        ]

      ]
    }
  };
}


// =========================
// NORMAL REPLY MENU
// =========================

function getMainMenu() {

  return {

    reply_markup: {

      keyboard: [

        [
          {
            text:
              "🌌 My Profile"
          },

          {
            text:
              "🛸 Invite Crew"
          }
        ],

        [
          {
            text:
              "💳 Payout (USDT)"
          }
        ]

      ],

      resize_keyboard:
        true,

      is_persistent:
        true
    }
  };
}


// =========================
// TELEGRAM MESSAGE
// =========================

async function handleTelegramUpdate(
  msg
) {

  if (
    !msg ||
    !msg.chat
  ) {
    return;
  }


  const chatId =
    msg.chat.id.toString();


  const text =
    msg.text || "";


  const userName =
    msg.from?.first_name ||
    msg.from?.username ||
    "Commander";


  const user =
    await ensureUser(
      chatId
    );


  if (!user) {

    await bot.sendMessage(
      chatId,
      "⚠️ Account database error. Please try again."
    );

    return;
  }


  const balance =
    Number(
      user.balance || 0
    );


  const usdt =
    (
      balance * 0.0001
    ).toFixed(2);


  // =========================
  // START
  // =========================

  if (
    text.startsWith("/start")
  ) {

    await bot.sendMessage(
      chatId,

      `🚀 *Welcome to USDT Galaxy, ${userName}!*

🪙 Balance: *${balance} GALAXY* 💵 Value: *$${usdt}*

Tap the button below to open your Galaxy Mini App.`,

      {
        parse_mode:
          "Markdown",

        ...getMainMenu()
      }
    );


    // IMPORTANT:
    // INLINE WEB APP BUTTON

    await bot.sendMessage(
      chatId,

      "🎬 *Watch & Earn*\n\nWatch videos and earn GALAXY.",

      {
        parse_mode:
          "Markdown",

        ...getMiniAppButton()
      }
    );


    return;
  }


  // =========================
  // PROFILE
  // =========================

  if (
    text === "🌌 My Profile"
  ) {

    await bot.sendMessage(
      chatId,

      `👤 *Commander Profile*

🪙 Galaxy Tokens: *${balance}* 💵 USDT Value: *$${usdt}*

Status: *Active*`,

      {
        parse_mode:
          "Markdown"
      }
    );

    return;
  }


  // =========================
  // INVITE
  // =========================

  if (
    text === "🛸 Invite Crew"
  ) {

    await bot.sendMessage(
      chatId,

      `🛸 *Recruit & Earn*

Earn *100 GALAXY* for every valid recruit.

🚀 Your referral link:

\`https://t.me/${BOT_USERNAME}?start=ref_${chatId}\``,

      {
        parse_mode:
          "Markdown"
      }
    );

    return;
  }


  // =========================
  // PAYOUT
  // =========================

  if (
    text === "💳 Payout (USDT)"
  ) {

    await bot.sendMessage(
      chatId,

      `🏦 *USDT Treasury (BEP-20)*

🪙 Balance: *${balance} GALAXY*

🔒 Threshold: *700 GALAXY*

💵 700 GALAXY = $0.07 USDT

🧾 Live Payout Proofs:
${PAYMENT_CHANNEL}`,

      {
        parse_mode:
          "Markdown"
      }
    );

    return;
  }
}


// =========================
// HTTP SERVER
// =========================

const server =
  http.createServer(
    (req, res) => {

      res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
      );

      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
      );

      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
      );


      // CORS

      if (
        req.method ===
        "OPTIONS"
      ) {

        res.writeHead(204);
        res.end();

        return;
      }


      // =========================
      // HEALTH
      // =========================

      if (
        req.method === "GET" &&
        (
          req.url === "/" ||
          req.url === "/health"
        )
      ) {

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/json"
          }
        );

        res.end(
          JSON.stringify({
            status:
              "ok"
          })
        );

        return;
      }


      // =========================
      // TELEGRAM WEBHOOK
      // =========================

      if (
        req.method === "POST" &&
        req.url ===
          `/bot${BOT_TOKEN}`
      ) {

        let body = "";

        req.on(
          "data",
          chunk => {
            body +=
              chunk.toString();
          }
        );


        req.on(
          "end",
          async () => {

            try {

              const update =
                JSON.parse(body);


              if (
                update.message
              ) {

                await handleTelegramUpdate(
                  update.message
                );
              }


              res.writeHead(
                200,
                {
                  "Content-Type":
                    "application/json"
                }
              );

              res.end(
                JSON.stringify({
                  ok:
                    true
                })
              );

            } catch (error) {

              console.error(
                "Webhook error:",
                error
              );

              res.writeHead(
                200
              );

              res.end(
                JSON.stringify({
                  ok:
                    false
                })
              );
            }
          }
        );

        return;
      }


      // =========================
      // SYNC
      // =========================

      if (
        req.method === "POST" &&
        req.url === "/sync"
      ) {

        let body = "";

        req.on(
          "data",
          chunk => {
            body +=
              chunk.toString();
          }
        );


        req.on(
          "end",
          async () => {

            try {

              const parsed =
                JSON.parse(body);


              const telegramUser =
                verifyTelegramInitData(
                  parsed.initData
                );


              if (!telegramUser) {

                res.writeHead(
                  401,
                  {
                    "Content-Type":
                      "application/json"
                  }
                );

                res.end(
                  JSON.stringify({
                    success:
                      false,

                    error:
                      "INVALID_TELEGRAM_SESSION"
                  })
                );

                return;
              }


              const chatId =
                telegramUser.id.toString();


              const user =
                await ensureUser(
                  chatId
                );


              if (!user) {
                throw new Error(
                  "USER_CREATE_FAILED"
                );
              }


              res.writeHead(
                200,
                {
                  "Content-Type":
                    "application/json"
                }
              );


              res.end(
                JSON.stringify({

                  success:
                    true,

                  balance:
                    Number(
                      user.balance || 0
                    )

                })
              );


            } catch (error) {

              console.error(
                "Sync error:",
                error
              );


              res.writeHead(
                500,
                {
                  "Content-Type":
                    "application/json"
                }
              );


              res.end(
                JSON.stringify({
                  success:
                    false,

                  error:
                    "SERVER_ERROR"
                })
              );
            }
          }
        );

        return;
      }


      // =========================
      // EARN
      // =========================

      if (
        req.method === "POST" &&
        req.url === "/earn"
      ) {

        let body = "";

        req.on(
          "data",
          chunk => {
            body +=
              chunk.toString();
          }
        );


        req.on(
          "end",
          async () => {

            try {

              const parsed =
                JSON.parse(body);


              const telegramUser =
                verifyTelegramInitData(
                  parsed.initData
                );


              if (!telegramUser) {

                res.writeHead(
                  401,
                  {
                    "Content-Type":
                      "application/json"
                  }
                );

                res.end(
                  JSON.stringify({
                    success:
                      false,

                    error:
                      "INVALID_TELEGRAM_SESSION"
                  })
                );

                return;
              }


              const allowedTasks = [
                "video1",
                "video2",
                "video3"
              ];


              if (
                !allowedTasks.includes(
                  parsed.taskId
                )
              ) {

                res.writeHead(
                  400,
                  {
                    "Content-Type":
                      "application/json"
                  }
                );

                res.end(
                  JSON.stringify({
                    success:
                      false,

                    error:
                      "INVALID_TASK"
                  })
                );

                return;
              }


              const chatId =
                telegramUser.id.toString();


              await ensureUser(
                chatId
              );


              // Server decides reward

              const result =
                await supabaseRequest(
                  "/rest/v1/rpc/increment_user_balance",
                  {
                    method:
                      "POST",

                    body:
                      JSON.stringify({

                        p_chat_id:
                          chatId,

                        p_amount:
                          EARN_AMOUNT

                      })
                  }
                );


              const newBalance =
                Number(result);


              res.writeHead(
                200,
                {
                  "Content-Type":
                    "application/json"
                }
              );


              res.end(
                JSON.stringify({

                  success:
                    true,

                  balance:
                    newBalance,

                  earned:
                    EARN_AMOUNT

                })
              );


            } catch (error) {

              console.error(
                "Earn error:",
                error
              );


              res.writeHead(
                500,
                {
                  "Content-Type":
                    "application/json"
                }
              );


              res.end(
                JSON.stringify({

                  success:
                    false,

                  error:
                    "EARN_FAILED"

                })
              );
            }
          }
        );

        return;
      }


      // =========================
      // 404
      // =========================

      res.writeHead(
        404,
        {
          "Content-Type":
            "application/json"
        }
      );

      res.end(
        JSON.stringify({
          error:
            "Not Found"
        })
      );
    }
  );


// =========================
// START
// =========================

const PORT =
  process.env.PORT ||
  10000;


server.listen(
  PORT,
  async () => {

    console.log(
      `🚀 Server running on port ${PORT}`
    );


    try {

      const webhookUrl =
        `${BACKEND_URL}/bot${BOT_TOKEN}`;


      await bot.setWebHook(
        webhookUrl
      );


      console.log(
        "✅ Telegram webhook configured"
      );

    } catch (error) {

      console.error(
        "❌ Webhook setup failed:",
        error
      );
    }
  }
);
