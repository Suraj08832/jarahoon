# 🚀 Heroku 24/7 Bot Deployment Guide

## ✅ Setup Complete!

Aapka bot ab Heroku par 24/7 run hoga. Sab kuch ready hai!

---

## 📋 Quick Deployment Steps

### Step 1: Heroku CLI Install & Login
```bash
# Heroku CLI install karein (agar nahi hai)
# Windows: https://devcenter.heroku.com/articles/heroku-cli

# Login karein
heroku login
```

### Step 2: Heroku App Create Karein
```bash
# Git repository mein jao
cd C:\Users\sandeep\Yr-apizefron

# Heroku app create karein
heroku create your-app-name
# Example: heroku create yt-apizefron-bot
```

### Step 3: Environment Variables Set Karein

```bash
# Bot Token (Telegram se @BotFather se lo)
heroku config:set BOT_TOKEN="8205616724:AAEGKyHQzn0P9HipN-OJNy0Ex3cnnxnrBjo"

# Owner ID (Apna Telegram User ID)
heroku config:set OWNER_ID="8115787127"

# Audio Channel ID
heroku config:set AUDIO_CHANNEL_ID="your_audio_channel_id"

# Video Channel ID  
heroku config:set VIDEO_CHANNEL_ID="your_video_channel_id"

# MongoDB URI
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/database"

# YouTube API Key (optional, agar song search chahiye)
heroku config:set YOUTUBE_API_KEY="your_youtube_api_key"

# YouTube Cookies (IMPORTANT - Bot detection avoid karne ke liye)
heroku config:set YOUTUBE_COOKIES='[{"name":"VISITOR_INFO1_LIVE","value":"..."}]'
```

### Step 4: Stack Set Karein (Docker use karega)
```bash
heroku stack:set container -a your-app-name
```

### Step 5: Deploy Karein
```bash
# Git add karein
git add .

# Commit karein
git commit -m "Deploy to Heroku with 24/7 support"

# Heroku par push karein
git push heroku main
```

### Step 6: Logs Check Karein
```bash
# Real-time logs dekhne ke liye
heroku logs --tail -a your-app-name
```

---

## 🔧 24/7 Operation Features

### ✅ Automatic Keep-Alive
- Bot automatically apne `/health` endpoint ko ping karta hai har 5 minutes mein
- Isse Heroku dyno sleep nahi hota
- **No extra configuration needed!**

### ✅ Health Check Endpoint
- `https://your-app.herokuapp.com/health` - Health check
- `https://your-app.herokuapp.com/` - API info

### ✅ API Endpoints (Ready to Use)
```
Audio Stream: https://your-app.herokuapp.com/audio/dQw4w9WgXcQ
Video Stream: https://your-app.herokuapp.com/video/dQw4w9WgXcQ
Video Info:   https://your-app.herokuapp.com/info/dQw4w9WgXcQ
```

**Note:** Video IDs automatically clean hote hain (prefixes like `0_` remove ho jate hain)

---

## 🎯 Usage Example

### Telegram Bot se:
```
/get dQw4w9WgXcQ
```

### Kisi bhi Music Bot mein API URL use karein:
```python
# Python example
audio_url = "https://your-app.herokuapp.com/audio/dQw4w9WgXcQ"
```

```javascript
// JavaScript example
const audioUrl = "https://your-app.herokuapp.com/audio/dQw4w9WgXcQ";
```

---

## 🔍 Troubleshooting

### Bot sleep ho raha hai?
```bash
# Dyno restart karein
heroku restart -a your-app-name

# Logs check karein
heroku logs --tail -a your-app-name
```

### API 404 error aa raha hai?
- Video ID check karein (11 characters hona chahiye)
- Prefixes automatically remove ho jate hain (`0_dQw4w9WgXcQ` → `dQw4w9WgXcQ`)
- URL format: `https://your-app.herokuapp.com/audio/VIDEO_ID` (no trailing slash)

### Bot start nahi ho raha?
```bash
# Environment variables check karein
heroku config -a your-app-name

# Logs check karein
heroku logs --tail -a your-app-name
```

---

## 📝 Important Notes

1. **Free Tier:** Heroku free tier ab nahi hai, paid plan chahiye ($5/month minimum)
2. **Dyno Hours:** Paid plan mein unlimited dyno hours milte hain
3. **Keep-Alive:** Automatic hai, kuch setup nahi karna
4. **API URL:** Deploy hone ke baad mil jayega: `https://your-app-name.herokuapp.com`

---

## 🎉 Success!

Deploy hone ke baad:
1. Bot Telegram par 24/7 online rahega
2. API endpoints ready honge kisi bhi bot mein use karne ke liye
3. Automatic video processing hoga jab bhi API call hogi

**API Base URL:** `https://your-app-name.herokuapp.com`

---

## 📞 Support

Agar koi problem ho:
1. `heroku logs --tail` se logs check karein
2. `/health` endpoint test karein
3. Environment variables verify karein

**Happy Coding! 🚀**

