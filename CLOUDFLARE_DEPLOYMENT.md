# Cloudflare Workers Deployment Guide

## Overview
Deploy your YouTube Telegram Bot to Cloudflare Workers for global edge distribution and fast API responses.

## Important Notes

⚠️ **Cloudflare Workers Limitations:**
- 10ms-50ms CPU time limit (not suitable for video downloads)
- No file system access
- Best for API endpoints and webhooks only

**Recommended Setup:**
1. **Main Bot on Replit/VPS**: Handles downloads, processing, uploads
2. **Cloudflare Worker**: Serves API endpoints for streaming audio/video

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

## Setup Steps

### 1. Install Dependencies

```bash
npm install --save-dev wrangler
npm install telegraf mongoose axios
```

### 2. Configure Environment Variables

Add secrets to Cloudflare Workers:

```bash
wrangler secret put BOT_TOKEN
# Enter your bot token when prompted

wrangler secret put MONGODB_URI
# Enter your MongoDB connection string

wrangler secret put AUDIO_CHANNEL_ID
# Enter your audio channel ID

wrangler secret put VIDEO_CHANNEL_ID
# Enter your video channel ID

wrangler secret put YOUTUBE_API_KEY
# Enter your YouTube API key

wrangler secret put OWNER_ID
# Enter your Telegram user ID

wrangler secret put WORKER_URL
# Enter your worker URL (e.g., https://youtube-telegram-bot.your-subdomain.workers.dev)
```

### 3. Update wrangler.toml

Edit `wrangler.toml` and update the name:

```toml
name = "your-bot-name"
```

### 4. Deploy to Cloudflare

```bash
wrangler deploy
```

You'll get a URL like:
```
https://your-bot-name.your-subdomain.workers.dev
```

### 5. Set Telegram Webhook

Point Telegram to your Cloudflare Worker:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-bot-name.your-subdomain.workers.dev/webhook"}'
```

**Verify webhook:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## API Endpoints

Once deployed, your Cloudflare Worker will serve these endpoints:

### 🎵 Stream Audio
```
GET https://your-worker-url/audio/:videoId
```

**Example:**
```
https://your-worker-url/audio/dQw4w9WgXcQ
```

**Use in Music Bot:**
```javascript
// Discord.js example
const audioUrl = 'https://your-worker-url/audio/dQw4w9WgXcQ';
const stream = await playdl.stream(audioUrl);
```

### 🎥 Stream Video
```
GET https://your-worker-url/video/:videoId
```

### ℹ️ Get Video Info
```
GET https://your-worker-url/info/:videoId
```

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Never Gonna Give You Up",
  "audioUrl": "/audio/dQw4w9WgXcQ",
  "videoUrl": "/video/dQw4w9WgXcQ",
  "createdAt": "2025-11-11T12:00:00.000Z",
  "lastAccessed": "2025-11-11T18:00:00.000Z"
}
```

### 📋 List All Videos
```
GET https://your-worker-url/list?page=1&limit=50
```

### 💚 Health Check
```
GET https://your-worker-url/health
```

## Using URLs in Your Music Bot

### Discord.js Bot Example:

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');

const WORKER_URL = 'https://your-worker-url';

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play')) {
    const videoId = message.content.split(' ')[1];
    
    // Get audio URL from your Cloudflare Worker
    const audioUrl = `${WORKER_URL}/audio/${videoId}`;
    
    // Create audio resource
    const resource = createAudioResource(audioUrl);
    
    // Play in voice channel
    const player = createAudioPlayer();
    player.play(resource);
    
    // Join voice channel and play
    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    connection.subscribe(player);
    
    await message.reply(`🎵 Playing audio from ${videoUrl}`);
  }
});
```

### Python Bot Example:

```python
import discord
from discord.ext import commands

WORKER_URL = "https://your-worker-url"

@bot.command()
async def play(ctx, video_id: str):
    # Get audio URL
    audio_url = f"{WORKER_URL}/audio/{video_id}"
    
    # Join voice channel
    voice_channel = ctx.author.voice.channel
    vc = await voice_channel.connect()
    
    # Play audio
    vc.play(discord.FFmpegPCMAudio(audio_url))
    
    await ctx.send(f"🎵 Playing: {audio_url}")
```

### Direct HTTP Request:

```javascript
// Fetch video info
const response = await fetch('https://your-worker-url/info/dQw4w9WgXcQ');
const data = await response.json();

console.log(data.title); // "Never Gonna Give You Up"
console.log(data.audioUrl); // "/audio/dQw4w9WgXcQ"

// Stream audio directly
const audioStream = await fetch(`https://your-worker-url/audio/dQw4w9WgXcQ`);
```

## Workflow Recommendations

### Two-Server Setup (Recommended):

**Server 1: Replit (Main Bot)**
- Handles YouTube downloads
- Processes audio/video with FFmpeg
- Uploads to Telegram channels
- Stores metadata in MongoDB

**Server 2: Cloudflare Workers (API)**
- Serves streaming endpoints
- Handles API requests globally
- Ultra-fast edge delivery
- Unlimited bandwidth

### How It Works:

1. User sends video ID to Telegram bot on Replit
2. Replit bot downloads, processes, and uploads to Telegram
3. Stores file IDs in MongoDB
4. User's music bot requests audio from Cloudflare Worker
5. Worker fetches file ID from MongoDB
6. Worker streams audio from Telegram CDN
7. Global edge caching for fast delivery

## Custom Domain (Optional)

Add a custom domain in Cloudflare Workers:

1. Go to Workers Dashboard
2. Select your worker
3. Click "Triggers" tab
4. Click "Add Custom Domain"
5. Enter your domain (e.g., `api.yourdomain.com`)

Your endpoints will be:
```
https://api.yourdomain.com/audio/:videoId
https://api.yourdomain.com/video/:videoId
```

## Monitoring

View logs in Cloudflare Dashboard:
```bash
wrangler tail
```

Or visit: **Workers → Your Worker → Logs**

## Costs

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request
- Unlimited bandwidth

**Paid Plan ($5/month):**
- 10 million requests/month
- 50ms CPU time per request

## Troubleshooting

### Worker not responding:
```bash
wrangler tail
```
Check for errors in logs

### Webhook not working:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Test endpoints:
```bash
curl "https://your-worker-url/health"
```

## Summary

✅ **Deploy to Cloudflare**: `wrangler deploy`  
✅ **Set Webhook**: Point Telegram to `/webhook`  
✅ **Use URLs**: Stream from `/audio/:videoId` in your music bot  
✅ **Global CDN**: Fast delivery worldwide  
✅ **Unlimited Bandwidth**: No bandwidth limits  

**Your music bot can now play audio directly from:**
```
https://your-worker-url/audio/:videoId
```

Perfect for Discord bots, Telegram music bots, or any streaming application! 🎵
