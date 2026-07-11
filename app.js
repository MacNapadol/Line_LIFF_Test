const MY_LIFF_ID = "2010672308-ckTBbuPW";

async function main() {
  // 🛡️ ตรวจสอบว่า SDK โหลดมาสมบูรณ์หรือยัง
  if (typeof liff === "undefined") {
    console.error("LIFF SDK ยังไม่ได้ถูกโหลดมาใช้งาน");
    alert("ไม่สามารถเชื่อมต่อ LINE SDK ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือปิด AdBlocker");
    return;
  }

  try {
    await liff.init({ liffId: MY_LIFF_ID });

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      
      const imgEl = document.getElementById("pictureUrl");
      if (imgEl) imgEl.src = profile.pictureUrl;
      
      const nameEl = document.getElementById("displayName");
      if (nameEl) nameEl.innerText = profile.displayName;
    } else {
      if (liff.isInClient()) {
        liff.login();
      } else {
        const nameEl = document.getElementById("displayName");
        if (nameEl) nameEl.innerText = "กรุณาเข้าสู่ระบบ";

        const statusEl = document.getElementById("statusText");
        if (statusEl) {
          statusEl.innerHTML = `
            <button onclick="handleManualLogin()" style="background:#06C755; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; margin-top:8px; font-weight:bold;">
              🔑 เข้าสู่ระบบด้วย LINE
            </button>
          `;
        }
      }
    }
  } catch (err) {
    console.error("LIFF Init Error:", err);
  }
}

function handleManualLogin() {
  liff.login({ redirectUri: window.location.href });
}

async function sendToCurrentChat() {
  if (!liff.isInClient()) {
    alert("ฟังก์ชันนี้ใช้งานได้เฉพาะการเปิดผ่านแอป LINE บนมือถือเท่านั้นครับ");
    return;
  }
  try {
    await liff.sendMessages([{ type: "text", text: "สวัสดีครับ! นี่คือข้อความทดสอบจาก LIFF 🎉" }]);
    alert("ส่งข้อความเข้าแชตแล้ว!");
    liff.closeWindow();
  } catch (err) {
    alert("ส่งข้อความไม่สำเร็จ: " + err.message);
  }
}

function openMyLink() {
  liff.openWindow({
    url: "https://line.me/ti/p/psoV4fne49",
    external: false
  });
}

async function shareFlexToFriends() {
  if (!liff.isApiAvailable("shareTargetPicker")) {
    alert("ฟังก์ชันนี้รองรับการใช้งานบนแอป LINE เท่านั้นครับ");
    return;
  }

  try {
    const res = await liff.shareTargetPicker([
      {
        type: "flex",
        altText: "มีคนส่งการ์ดจาก LIFF มาให้คุณ!",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "My LIFF Application", weight: "bold", size: "lg", color: "#06C755" },
              { type: "text", text: "กดปุ่มด้านล่างเพื่อเปิดใช้งาน LIFF ของฉันได้เลย!", margin: "md", size: "sm", wrap: true }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#06C755",
                action: {
                  type: "uri",
                  label: "เปิดดู LIFF",
                  uri: "https://liff.line.me/2010672308-ckTBbuPW"
                }
              }
            ]
          }
        }
      }
    ]);
    if (res) alert("แชร์ให้เพื่อนสำเร็จ!");
  } catch (err) {
    alert("แชร์ไม่สำเร็จ: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", main);
