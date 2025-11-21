# 🚀 Render Deployment Guide (Bot + API)

Yeh guide Telegram Bot aur API dono ko ek saath Render par deploy karne ke liye hai.

## 📋 Pre-requisites

1. ✅ GitHub repository
2. ✅ Render.com account
3. ✅ Telegram Bot Token (@BotFather se)
4. ✅ MongoDB Atlas account (free tier)
5. ✅ Telegram channels (Audio aur Video ke liye)

---

## 🔧 Setup Steps

### 1️⃣ MongoDB Atlas Setup

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) par login karein
2. **"Create a New Cluster"** → **M0 (Free tier)** select karein
3. **Database Access** mein user create karein (username/password save karein)
4. **Network Access** mein **"Allow Access from Anywhere"** (0.0.0.0/0) add karein
5. **Connect** button → **"Connect your application"** → Connection string copy karein
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/youtube-bot
   ```

---

### 2️⃣ Telegram Channels Setup

1. **Audio Channel** create karein (public ya private)
2. **Video Channel** create karein (public ya private)
3. Bot ko dono channels mein **admin** bana dein
4. Channel ID fetch karne ke liye:
   - Channel mein koi message forward karein [@JsonDumpBot](https://t.me/JsonDumpBot) ko
   - `"forward_from_chat": {"id": -100XXXXXXXXX}` - yeh channel ID hai

---

### 3️⃣ Render Deployment

1. **[Render.com](https://render.com)** par login karein

2. **Dashboard** → **"New +"** → **"Blueprint"**

3. **GitHub repository connect** karein

4. Render automatically `render.yaml` detect kar lega aur configure karega (service type: **web**, kyunki bot + API dono ek saath run honge)

5. **Environment Variables** add karein:

```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
AUDIO_CHANNEL_ID=-1001234567890
VIDEO_CHANNEL_ID=-1001234567891
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/youtube-bot
OWNER_ID=8115787127
NODE_ENV=production
```

6. **"Create Web Service"** button click karein

---

## 📝 Environment Variables Details

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | `123456789:ABC...` |
| `AUDIO_CHANNEL_ID` | Audio files store karne ka channel | `-1001234567890` |
| `VIDEO_CHANNEL_ID` | Video files store karne ka channel | `-1001234567891` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `OWNER_ID` | Aapka Telegram user ID | `8115787127` |

**Owner ID kaise pata karein?**
- [@userinfobot](https://t.me/userinfobot) ko `/start` bhejein

---

## ⚠️ Important Notes

### Free Tier Limitations:
- ⏰ **15 minutes inactivity** ke baad service sleep mode mein chali jati hai
- 🐌 Pehla message bhejne par **30-60 seconds** lag sakta hai (wake up time)
- 💾 **Monthly data transfer limit:** 100GB

### Recommended:
- 💰 **Starter Plan ($7/month)** lena better hai production use ke liye
- 🔄 Always-on service (no sleep)
- ⚡ Faster response times

---

## 🧪 Testing

Bot deploy hone ke baad:

1. Telegram par apne bot ko `/start` bhejein
2. Test command: `/song never gonna give you up`
3. Ya direct YouTube URL bhejein

---

## 🛠️ Files Created for Render:

- ✅ `index.js` - Bot aur API dono ek saath run karta hai
- ✅ `build.sh` - yt-dlp aur ffmpeg install karta hai
- ✅ `render.yaml` - Render configuration file (web service)

## 🌐 API Endpoints:

Bot deploy hone ke baad yeh API endpoints available honge:

- `GET /` - API information
- `GET /health` - Health check
- `GET /audio/:videoId` - Stream audio file
- `GET /video/:videoId` - Stream video file
- `GET /info/:videoId` - Get video information
- `GET /list?page=1&limit=50` - List all processed videos

**Example:**
```
https://youtube-telegram-bot-api.onrender.com/audio/dQw4w9WgXcQ
https://youtube-telegram-bot-api.onrender.com/video/dQw4w9WgXcQ
https://youtube-telegram-bot-api.onrender.com/info/dQw4w9WgXcQ
```

---

## 🔍 Troubleshooting

### Bot respond nahi kar raha:
1. Render dashboard → **Logs** check karein
2. Environment variables sahi hain ya nahi verify karein
3. Bot ko channels mein admin banaya hai ya nahi check karein

### "yt-dlp not found" error:
- `build.sh` script properly run ho raha hai ya nahi logs mein check karein
- Build logs mein `✅ yt-dlp version:` dikhna chahiye

### MongoDB connection error:
- Connection string mein password sahi hai
- Network Access mein `0.0.0.0/0` added hai
- Database user create kiya hai

---

## 📞 Support

Agar koi problem ho toh Render logs check karein:
```
Dashboard → Your Service → Logs
```

Happy Deploying! 🎉
