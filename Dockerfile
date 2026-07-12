FROM node:18-slim

# ติดตั้ง Chromium และฟอนต์ภาษาไทย (fonts-thai-tlwg)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-thai-tlwg \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ตั้งค่าให้ Puppeteer ใช้ Chromium ของระบบ
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]