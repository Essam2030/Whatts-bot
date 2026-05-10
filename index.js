const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ==================== CONFIG ====================
const GEMINI_API_KEY = "AIzaSyDaLAi4W1tbhiuffOQb8eFgO9Os3zXvjM8";
const ID_INSTANCE = "7107615297";
const API_TOKEN = "b3d24cd2972e41fbbe565ee4ca3264f1faf374ff1a0d480484";
const GREEN_API_URL = `https://api.green-api.com/waInstance${ID_INSTANCE}`;

// ==================== GEMINI ====================
async function askGemini(userMessage) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              text: `أنت مساعد ذكي للرد على رسائل واتساب. رد بشكل مختصر ومفيد باللغة العربية.
              
رسالة المستخدم: ${userMessage}`
            }
          ]
        }
      ]
    });
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Gemini error:", err.message);
    return "عذراً، حدث خطأ. حاول مرة أخرى.";
  }
}

// ==================== SEND MESSAGE ====================
async function sendMessage(chatId, message) {
  try {
    await axios.post(`${GREEN_API_URL}/sendMessage/${API_TOKEN}`, {
      chatId,
      message
    });
    console.log(`✅ Sent to ${chatId}`);
  } catch (err) {
    console.error("Send error:", err.message);
  }
}

// ==================== WEBHOOK ====================
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  console.log("📩 Incoming:", JSON.stringify(body, null, 2));

  // تجاهل غير الرسائل النصية
  if (body.typeWebhook !== "incomingMessageReceived") return;
  if (!body.messageData || body.messageData.typeMessage !== "textMessage") return;

  const chatId = body.senderData?.chatId;
  const text = body.messageData?.textMessageData?.textMessage;

  if (!chatId || !text) return;

  console.log(`📨 From: ${chatId} | Message: ${text}`);

  // الرد بـ Gemini
  const reply = await askGemini(text);
  console.log(`🤖 Gemini Reply: ${reply}`);

  await sendMessage(chatId, reply);
});

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({ status: "✅ WhatsApp Bot is running!", time: new Date().toISOString() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
