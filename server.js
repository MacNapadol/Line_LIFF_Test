const express = require("express");
const line = require("@line/bot-sdk");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL =
  process.env.BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${PORT}`;

// ตั้งค่า LINE Config
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

// ให้บริการ Static File สำหรับภาพที่ Capture ได้
app.use("/public", express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------------
// 1. HTML Routes สำหรับเปิดดู/แคปหน้าเว็บ
// ----------------------------------------------------------------
app.get("/store", (req, res) =>
  res.sendFile(path.join(__dirname, "views/store.html")),
);
app.get("/profile", (req, res) =>
  res.sendFile(path.join(__dirname, "views/profile.html")),
);
app.get("/promotion", (req, res) =>
  res.sendFile(path.join(__dirname, "views/promotion.html")),
);
app.get("/news", (req, res) =>
  res.sendFile(path.join(__dirname, "views/news.html")),
);

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.post("/api/login", (req, res) => {
  const { userId, displayName, pictureUrl } = req.body;
  console.log("Logged in User:", { userId, displayName, pictureUrl });
  res.json({ status: "success", message: "User logged in successfully" });
});

// ----------------------------------------------------------------
// 2. ฟังก์ชัน Capture HTML ออกมาเป็นรูปภาพ
// ----------------------------------------------------------------
async function captureHtmlToImage(routePath, filename) {
  const { default: puppeteer } = await import("puppeteer");

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote",
      "--no-first-run",
      "--disable-extensions",
    ],
  });

  const page = await browser.newPage();

  // เปิดไปยัง URL ภายในเครื่อง
  await page.goto(`http://localhost:${PORT}${routePath}`, {
    waitUntil: "networkidle0",
  });

  // เลือกแคปเฉพาะ Element #capture-area
  const element = await page.$("#capture-area");
  const outputDir = path.join(__dirname, "public/images");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, filename);
  await element.screenshot({ path: filePath, type: "png" });
  await browser.close();

  return `${BASE_URL}/public/images/${filename}`;
}

// ----------------------------------------------------------------
// 3. Webhook Endpoint
// ----------------------------------------------------------------
app.post(
  "/webhook",
  line.middleware({ channelSecret: process.env.CHANNEL_SECRET }),
  (req, res) => {
    Promise.all(req.body.events.map(handleEvent))
      .then((result) => res.json(result))
      .catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  },
);

async function handleEvent(event) {
  if (event.type !== "postback" && event.type !== "message") return null;
  if (event.type === "message" && event.message.type !== "text") return null;

  const actionKey =
    event.type === "postback"
      ? event.postback.data || ""
      : event.message.text || "";

  let routePath = "";
  let filename = "";

  if (actionKey.includes("action=store") || actionKey === "เมนูร้านค้า") {
    routePath = "/store";
    filename = `store_${Date.now()}.png`;
  } else if (
    actionKey.includes("action=profile") ||
    actionKey === "เมนูโปรไฟล์"
  ) {
    routePath = "/profile";
    filename = `profile_${Date.now()}.png`;
  } else if (
    actionKey.includes("action=promotion") ||
    actionKey === "เมนูโปรโมชัน"
  ) {
    routePath = "/promotion";
    filename = `promotion_${Date.now()}.png`;
  } else if (actionKey.includes("action=news") || actionKey === "เมนูข่าวสาร") {
    routePath = "/news";
    filename = `news_${Date.now()}.png`;
  }

  if (routePath) {
    try {
      console.log(`[LOG] Capturing image for ${routePath}...`);
      const imageUrl = await captureHtmlToImage(routePath, filename);
      console.log(`[LOG] Image created successfully: ${imageUrl}`);

      return await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "image",
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl,
          },
        ],
      });
    } catch (error) {
      console.error("[ERROR inside handleEvent]:", error);
    }
  }

  return Promise.resolve(null);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
