const TelegramBot = require("node-telegram-bot-api");
const http = require("http");
const crypto = require("crypto");

// ==================================================
// CONFIG
// ==================================================

// 👇 SIRF YE BOT TOKEN CHANGE KARNA HAI
const BOT_TOKEN = "8996114363:AAG6KZtjbzgI8H7mceyKECWD5Yng29TXudQ";

// Supabase URL
const SUPABASE_URL =
  "https://uxunxwbmftxwqpfaoxhn.supabase.co";

// ⚠️ Secret key Railway Variable se hi aayegi
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mini App
const WEB_APP_URL =
  "https://airdropnewmera.vercel.app/";

// Railway backend
const BACKEND_URL =
  "https://usdtbot-production-89e9.up.railway.app";

const STARTING_BALANCE = 500;
const EARN_AMOUNT = 100;

// ==================================================
// CHECK CONFIG
// ==================================================

if (
  !BOT_TOKEN ||
  BOT_TOKEN === "PASTE_NEW_BOT_TOKEN_HERE"
) {
  console.error("❌ BOT_TOKEN missing");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY missing in Railway Variables"
  );
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

// ==================================================
// SUPABASE
// ==================================================

async function supabaseRequest(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}${path}`,
    {
      ...options,

      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,

        Authorization:
          `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

        "Content-Type":
          "application/json",

        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
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

// ==================================================
// USER
// ==================================================

async function getUser(chatId) {
  const data =
    await supabaseRequest(
      `/rest/v1/users?chat_id=eq.${encodeURIComponent(
        chatId
      )}&select=*`
    );

  return data && data.length
    ? data[0]
    : null;
}

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
            chat_id: chatId,
            balance:
              STARTING_BALANCE
          })
        }
      );

    return data && data.length
      ? data[0]
      : null;

  } catch (error) {

    console.error(
      "Create user error:",
      error
    );

    return await getUser(chatId);
  }
}

async function ensureUser(chatId) {
  let user =
    await getUser(chatId);

  if (!user) {
    user =
      await createUser(chatId);
  }

  return user;
}

// ==================================================
// TELEGRAM INIT DATA VERIFICATION
// ==================================================

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
        .update(
          dataCheckString
        )
        .digest("hex");

    if (
      calculatedHash !==
      receivedHash
    ) {
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
      return null;
    }

    const userString =
      params.get("user");

    if (!userString) {
      return null;
    }

    const telegramUser =
      JSON.parse(userString);

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

// ==================================================
// /START
// BOT ONLY OPENS MINI APP
// ==================================================

async function handleStart(msg) {

  const chatId =
    msg.chat.id.toString();

  // Create account if first time
  await ensureUser(chatId);

  // Remove old keyboard
  try {

    await bot.sendMessage(
      chatId,
      "🌌 USDT Galaxy",
      {
        reply_markup: {
          remove_keyboard: true
        }
      }
    );

  } catch (error) {

    console.error(
      "Keyboard removal error:",
      error
    );
  }

  // ONLY MINI APP BUTTON
  await bot.sendMessage(
    chatId,

    "🚀 *Welcome to USDT Galaxy!*\n\nTap below to open the Mini App.",

    {
      parse_mode:
        "Markdown",

      reply_markup: {

        inline_keyboard: [

          [

            {
              text:
                "🚀 Open USDT Galaxy",

              web_app: {
                url:
                  WEB_APP_URL
              }
            }

          ]

        ]

      }

    }
  );
}

// ==================================================
// HTTP SERVER
// ==================================================

const server =
  http.createServer(
    (req, res) => {

      // CORS
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

      // OPTIONS
      if (
        req.method ===
        "OPTIONS"
      ) {

        res.writeHead(204);

        res.end();

        return;
      }

      // ==================================================
      // HEALTH
      // ==================================================

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

      // ==================================================
      // TELEGRAM WEBHOOK
      // ==================================================

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

              // ONLY /start
              if (
                update.message &&
                update.message.text &&
                update.message.text
                  .startsWith(
                    "/start"
                  )
              ) {

                await handleStart(
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
                  ok: true
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
                  ok: false
                })
              );
            }

          }
        );

        return;
      }

      // ==================================================
      // SYNC BALANCE
      // ==================================================

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
                  "USER_NOT_FOUND"
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
                      user.balance ||
                      0
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

      // ==================================================
      // EARN
      // ==================================================

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

              const allowedTasks =
                [
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

      // ==================================================
      // NOT FOUND
      // ==================================================

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

// ==================================================
// START SERVER
// ==================================================

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

      // Remove old webhook
      await bot.deleteWebHook();

      console.log(
        "🧹 Old webhook removed"
      );

      // Set new webhook
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
        "❌ Webhook error:",
        error
      );
    }

  }
);
