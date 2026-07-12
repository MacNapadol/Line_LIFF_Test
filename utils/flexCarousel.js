function createFlexCarousel({ altText = "รายการ", items = [], buttonLabel = "ดูรายละเอียด" }) {
  return {
    type: "flex",
    altText: altText,
    contents: {
      type: "carousel",
      contents: items.map((item) => ({
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: item.bgColor || "#F3F4F6",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: item.icon || "📌",
              size: "5xl",
              align: "center",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: item.title,
              weight: "bold",
              size: "lg",
              color: item.textColor || "#1F2937",
            },
            {
              type: "text",
              text: item.desc,
              size: "sm",
              color: "#4B5563",
              wrap: true,
              margin: "md",
            },
          ],
        },
        footer: item.linkUrl ? {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              color: item.textColor || "#1F2937",
              action: {
                type: "uri",
                label: buttonLabel,
                uri: item.linkUrl,
              },
            },
          ],
        } : undefined,
      })),
    },
  };
}

module.exports = { createFlexCarousel };