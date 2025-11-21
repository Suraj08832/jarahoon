# 🎵 Music Bot ke liye URL kaise use karein

## Quick Start

Aapke paas ab 2 options hain streaming ke liye:

### Option 1: Direct Replit URL (Recommended for Development)
```
https://your-repl-name.repl.co/api/audio/:videoId
https://your-repl-name.repl.co/api/video/:videoId
```

### Option 2: Cloudflare Workers URL (Recommended for Production)
```
https://your-worker.workers.dev/audio/:videoId
https://your-worker.workers.dev/video/:videoId
```

---

## ✅ Cloudflare Workers ke Fayde

1. **Global CDN** - Duniya bhar mein fast delivery
2. **Unlimited Bandwidth** - Koi bandwidth limit nahi
3. **Auto-scaling** - Traffic badhe to automatically scale hoga
4. **Free Tier** - 100,000 requests/day free
5. **Edge Caching** - Files cache rehti hain, faster loading

---

## 🚀 Setup Kaise Karein

### Step 1: Replit Bot Deploy karein

Bot ko Replit par chalaye rakhen. Ye downloads handle karega:

```bash
# Replit mein ye already running hai
npm start
```

### Step 2: Cloudflare Worker Deploy karein

```bash
# Wrangler install karein
npm install -g wrangler

# Login karein
wrangler login

# Secrets add karein
wrangler secret put BOT_TOKEN
# Apna Telegram bot token enter karein

wrangler secret put MAIN_SERVER_URL
# Apna Replit URL enter karein: https://your-repl.repl.co

# Deploy karein
wrangler deploy
```

Aapko URL milega:
```
https://youtube-telegram-bot.your-name.workers.dev
```

---

## 📱 Discord Bot mein Kaise Use Karein

### Example 1: Discord.js

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { 
  createAudioPlayer, 
  createAudioResource, 
  joinVoiceChannel 
} = require('@discordjs/voice');

const WORKER_URL = 'https://your-worker.workers.dev';

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play')) {
    const videoId = message.content.split(' ')[1];
    
    // Audio URL
    const audioUrl = `${WORKER_URL}/audio/${videoId}`;
    
    // Audio resource banayein
    const resource = createAudioResource(audioUrl);
    const player = createAudioPlayer();
    player.play(resource);
    
    // Voice channel join karein
    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    connection.subscribe(player);
    await message.reply(`🎵 Playing: ${audioUrl}`);
  }
});
```

### Example 2: Python Discord Bot

```python
import discord
from discord.ext import commands

WORKER_URL = "https://your-worker.workers.dev"

@bot.command()
async def play(ctx, video_id: str):
    # Audio URL banayein
    audio_url = f"{WORKER_URL}/audio/{video_id}"
    
    # Voice channel join karein
    voice_channel = ctx.author.voice.channel
    vc = await voice_channel.connect()
    
    # Audio play karein
    vc.play(discord.FFmpegPCMAudio(audio_url))
    
    await ctx.send(f"🎵 Ab bajega: {audio_url}")
```

---

## 🎭 Telegram Music Bot mein Use Karein

```python
from telegram import Update
from telegram.ext import Updater, CommandHandler
import requests

WORKER_URL = "https://your-worker.workers.dev"

def play_command(update: Update, context):
    video_id = context.args[0]
    audio_url = f"{WORKER_URL}/audio/{video_id}"
    
    # Audio file send karein
    update.message.reply_audio(
        audio=audio_url,
        title=f"Video: {video_id}"
    )

# Handler add karein
dispatcher.add_handler(CommandHandler('play', play_command))
```

---

## 🔍 Video ID Kaise Pata Karein

### Telegram Bot Use Karke:

1. **Song name se:**
   ```
   Send to bot: Crush hu tera song tu hai kahan
   ```
   Bot automatically search karke download karega aur video ID dega

2. **YouTube URL se:**
   ```
   Send to bot: https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
   Bot process karega aur video ID store karega

3. **Video ID directly:**
   ```
   /get dQw4w9WgXcQ
   ```

Bot response mein aapko milega:
```
📊 Video Info:
Title: Never Gonna Give You Up
Video ID: dQw4w9WgXcQ
API Audio: /audio/dQw4w9WgXcQ
API Video: /video/dQw4w9WgXcQ
```

---

## 📋 All Videos List Fetch Karein

```javascript
// List of all videos
fetch('https://your-worker.workers.dev/list?page=1&limit=50')
  .then(res => res.json())
  .then(data => {
    console.log('Total videos:', data.pagination.total);
    data.videos.forEach(video => {
      console.log(`${video.title} - ${video.videoId}`);
    });
  });
```

---

## 🎯 Real Example - Complete Flow

### 1. User request karta hai
```
Discord/Telegram: "Play Crush hu tera song"
```

### 2. Bot Telegram bot ko bhejta hai
```
Message to Telegram bot: "Crush hu tera song tu hai kahan"
```

### 3. Telegram bot process karta hai
- YouTube search karta hai
- Audio/Video download karta hai
- Telegram channels mein upload karta hai
- MongoDB mein save karta hai
- Video ID return karta hai: `xyz123abc`

### 4. Music bot audio play karta hai
```javascript
const audioUrl = `https://your-worker.workers.dev/audio/xyz123abc`;
player.play(audioUrl);
```

### 5. Cloudflare Worker serve karta hai
- Replit API se file ID fetch karta hai
- Telegram CDN se audio stream karta hai
- Edge caching se fast delivery
- User ko audio mil jata hai 🎵

---

## ⚙️ Important URLs

### Replit URLs (Development)
```
Main Bot: https://your-repl.repl.co
API Health: https://your-repl.repl.co/api/health
Audio Stream: https://your-repl.repl.co/api/audio/:videoId
Video Stream: https://your-repl.repl.co/api/video/:videoId
Info API: https://your-repl.repl.co/api/info/:videoId
List API: https://your-repl.repl.co/api/list
```

### Cloudflare URLs (Production)
```
Worker: https://your-worker.workers.dev
Health: https://your-worker.workers.dev/health
Audio Stream: https://your-worker.workers.dev/audio/:videoId
Video Stream: https://your-worker.workers.dev/video/:videoId
Info API: https://your-worker.workers.dev/info/:videoId
List API: https://your-worker.workers.dev/list
```

---

## 🎬 Video Example

**Video download karne ke liye:**
```
Telegram bot ko send karein: "Never Gonna Give You Up"
```

**Response:**
```
Video ID: dQw4w9WgXcQ
```

**Music bot mein use karein:**
```javascript
const audioUrl = 'https://your-worker.workers.dev/audio/dQw4w9WgXcQ';
player.play(audioUrl);
```

---

## 💡 Tips

1. **Video IDs save rakhein** - Ek baar download ho gaya to wahi ID use karte raho
2. **Cloudflare URL use karein production mein** - Fast aur reliable hai
3. **Cache benefit milega** - Ek baar load hui file dubara fast milegi
4. **CORS enabled hai** - Kisi bhi app se use kar sakte hain
5. **Unlimited bandwidth** - Jitna chahe stream karo

---

## 🆘 Troubleshooting

**Problem:** Audio nahi mil raha
**Solution:** 
```javascript
// Pehle check karein video exist karta hai
fetch('https://your-worker.workers.dev/info/dQw4w9WgXcQ')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Problem:** Worker deploy nahi ho raha
**Solution:**
```bash
# Wrangler update karein
npm update -g wrangler

# Phir se deploy karein
wrangler deploy
```

**Problem:** Main server ka URL nahi pata
**Solution:**
Replit dashboard mein dekhen, ya environment variable check karein:
```bash
echo $REPL_SLUG
```

---

## 📞 Support

Koi problem ho to:
1. Logs check karein: `wrangler tail`
2. Health endpoint check karein: `/health`
3. Bot status check karein Replit dashboard mein

---

Ab aap ready hain apne music bot mein streaming URLs use karne ke liye! 🎉🎵
