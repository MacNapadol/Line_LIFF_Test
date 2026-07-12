const express = require("express");
const line = require("@line/bot-sdk");
const path = require("path");
const fs = require("fs");

const { createFlexCarousel } = require("./utils/flexCarousel");

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
  let browser = null;

  try {
    browser = await puppeteer.launch({
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

    await page.setViewport({ width: 800, height: 600 });

    await page.goto(`http://localhost:${PORT}${routePath}`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    const element = (await page.$("#capture-area")) || (await page.$("body"));

    const outputDir = path.join(__dirname, "public/images");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filePath = path.join(outputDir, filename);
    await element.screenshot({ path: filePath, type: "png" });

    const cleanBaseUrl = BASE_URL.replace("http://", "https://");
    return `${cleanBaseUrl}/public/images/${filename}`;
  } catch (err) {
    console.error("[Puppeteer Error]:", err);
    throw err;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
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

  if (actionKey.includes("action=store") || actionKey === "เมนูร้านค้า") {
    // อนาคตเปลี่ยนเป็น: const storesData = await db.getStores();
    const storesData = [
      {
        title: "เม้งการยาง",
        desc: "บริการเปลี่ยนยาง ถ่วงล้อ",
        icon: "🛞",
        bgColor: "#EFF6FF",
        textColor: "#1E3A8A",
        linkUrl: `${BASE_URL}/store?id=meng`,
      },
      {
        title: "adolf การบัญชี",
        desc: "รับทำบัญชี และยื่นภาษีครบวงจร",
        icon: "📊",
        bgColor: "#F0FDF4",
        textColor: "#14532D",
        linkUrl: `${BASE_URL}/store?id=adolf`,
      },
      {
        title: "crp ขายแต่เวย์",
        desc: "เวย์โปรตีนแท้ 100% เกรดพรีเมียม",
        icon: "🥤",
        bgColor: "#FFF7ED",
        textColor: "#7C2D12",
        linkUrl: `${BASE_URL}/store?id=crp`,
      },
    ];

    return await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        createFlexCarousel({
          altText: "รายการร้านค้าในเครือ",
          items: storesData,
          buttonLabel: "ลงทะเบียน",
        }),
      ],
    });
  }

  if (actionKey.includes("action=promotion") || actionKey === "เมนูโปรโมชัน") {
    // อนาคตเปลี่ยนเป็น: const promotionsData = await db.getPromotions();
    const promotionsData = [
      {
        title: "ลดพิเศษ 50%",
        desc: "ส่วนลดสำหรับสมาชิกใหม่ต้อนรับเดือนนี้",
        icon: "🏷️",
        bgColor: "#FEF2F2",
        textColor: "#991B1B",
        linkUrl: `${BASE_URL}/promotion`,
      },
      {
        title: "ส่งฟรี คุ้มสุดๆ",
        desc: "เมื่อซื้อสินค้าครบ 500 บาทขึ้นไป",
        icon: "🚚",
        bgColor: "#FFFBEB",
        textColor: "#92400E",
        linkUrl: `${BASE_URL}/promotion`,
      },
    ];

    return await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        createFlexCarousel({
          altText: "รายการโปรโมชันพิเศษ",
          items: promotionsData,
          buttonLabel: "รับสิทธิ์",
        }),
      ],
    });
  }

  if (actionKey.includes("action=news") || actionKey === "เมนูข่าวสาร") {
    // อนาคตเปลี่ยนเป็น: const newsData = await db.getNews();
    const newsData = [
      {
        title: "อัปเดตระบบใหม่",
        desc: "เพิ่มระบบสะสมแต้มและแลกของรางวัล",
        icon: "📰",
        bgColor: "#F0FDF4",
        textColor: "#166534",
        linkUrl: `${BASE_URL}/news`,
      },
    ];

    return await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        createFlexCarousel({
          altText: "ข่าวสารล่าสุด",
          items: newsData,
          buttonLabel: "อ่านเพิ่มเติม",
        }),
      ],
    });
  }

  let routePath = "";
  let filename = "";

  if (actionKey.includes("action=profile") || actionKey === "เมนูโปรไฟล์") {
    routePath = "/profile";
    filename = `profile_${Date.now()}.png`;
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
