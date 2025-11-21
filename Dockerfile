FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir yt-dlp --break-system-packages

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

ENV PORT=5000
ENV NODE_PATH=/usr/local/bin/node

EXPOSE 5000

CMD ["node", "index.js"]
