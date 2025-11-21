# YouTube to Telegram Bot

A comprehensive Node.js system that downloads YouTube videos, uploads audio and video to separate Telegram channels, stores metadata in MongoDB, and serves content via a public API.

## Features

- 🤖 **Telegram Bot** - Interactive bot for processing YouTube videos
- 📥 **Smart Downloading** - Uses ytdl-core to download audio and video separately
- 📤 **Channel Upload** - Uploads audio to Channel A, video to Channel B
- 💾 **MongoDB Storage** - Stores metadata and file IDs for quick access
- 🚀 **Caching System** - Reuses existing files for duplicate requests
- 🌐 **Public API** - Express endpoints for streaming audio/video
- 📊 **File Management** - Automatic cleanup of temporary downloads
- 💓 **Keep-Alive System** - Auto-ping every 5 minutes to prevent service sleep on Render/Replit
- 🔒 **CORS Enabled** - API accessible from any domain for music bot integration
- 🎯 **Improved Error Handling** - Better error messages and logging for debugging
- 🤖 **Auto-Processing API** - Videos automatically downloaded and saved when requested via API if not in database

## Architecture

```
/bot
├── index.js          # Telegraf bot initialization
├── handlers.js       # Command handlers (/start, /get, /info)
├── youtube.js        # ytdl-core downloader
└── uploader.js       # Telegram channel uploader

/api
├── index.js          # Express server
└── routes.js         # API endpoints

/db
└── model.js          # MongoDB schema

index.js              # Main entry point
```

## Setup Instructions

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Save the bot token

### 2. Get Your Telegram User ID

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your user ID (example: 8115787127)
3. Save this - only this user will have access to the bot

### 3. Create Telegram Channels

1. Create two channels (Audio Channel and Video Channel)
2. Add your bot as an administrator to both channels
3. Get the channel IDs (use @userinfobot or check channel links)
   - Format: `@channelname` or `-100XXXXXXXXXX`

### 4. Set Up MongoDB

You can use:
- MongoDB Atlas (free cloud database)
- Local MongoDB installation
- Any MongoDB-compatible service

Get your connection URI in the format:
```
mongodb://username:password@host:port/database
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
BOT_TOKEN=your_telegram_bot_token_here
OWNER_ID=8115787127
AUDIO_CHANNEL_ID=@your_audio_channel
VIDEO_CHANNEL_ID=@your_video_channel
MONGODB_URI=mongodb://localhost:27017/youtube-telegram-bot
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=5000
```

### 6. Add YouTube API Key (for search functionality)

To enable song/video search by name:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your `.env` file:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

### 7. (Optional) Add YouTube Cookies

For improved download reliability and access to age-restricted content:

1. Export your YouTube cookies using a browser extension
2. Save them to `cookies.txt` in Netscape format
3. The bot will automatically use them if present

### 8. Install Dependencies

```bash
npm install
```

### 9. Run the Application

```bash
npm start
```

## Bot Commands

- `/start` - Welcome message and instructions
- `/get <video_id>` - Download and process a YouTube video
- `/info <video_id>` - Get video information
- `/restart` - Restart the bot (owner only)

You can also:
- Send a YouTube URL or video ID directly to the bot
- **Search by song/video name** - Just type the song or video name and the bot will find it for you (requires YOUTUBE_API_KEY)

## 🌍 Deployment Options

### Option 1: Render (Simple & Free)

Deploy your bot to Render with automatic deployments and free hosting:

**Setup:**

1. **Create a Render account** at [render.com](https://render.com)

2. **Connect your GitHub repository** to Render

3. **Create a new Web Service:**
   - Render will auto-detect the `render.yaml` configuration
   - Or manually configure:
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Environment: Node

4. **Add Environment Variables** in Render dashboard:
   - `BOT_TOKEN` - Your Telegram bot token
   - `AUDIO_CHANNEL_ID` - Telegram channel ID for audio
   - `VIDEO_CHANNEL_ID` - Telegram channel ID for video
   - `MONGODB_URI` - MongoDB connection string
   - `OWNER_ID` - Your Telegram user ID

   **Note:** `RENDER_EXTERNAL_URL` is automatically provided by Render and used for the keep-alive system. No need to set it manually.

5. **Deploy!** Render will build and deploy automatically

**What you get:**
- 🆓 Free tier available (with sleep after inactivity)
- 🔄 Auto-deploy from GitHub
- 🌐 HTTPS by default
- 📊 Logs and monitoring
- ⚡ Fast deployment

**Your API will be available at:**
```
https://your-app-name.onrender.com/audio/:videoId
https://your-app-name.onrender.com/video/:videoId
```

**Note:** Free tier services sleep after 15 minutes of inactivity. First request after sleep may take 30-60 seconds to wake up.

### Option 2: Cloudflare Workers (Recommended for Production)

For global edge delivery with unlimited bandwidth:

**Setup:**
```bash
npm install -g wrangler
wrangler login
wrangler secret put BOT_TOKEN
wrangler secret put MAIN_SERVER_URL  # Your Replit URL
wrangler deploy
```

**What you get:**
- 🌐 Global CDN with edge caching
- ⚡ Ultra-fast response times worldwide
- 💰 100,000 requests/day free tier
- 🔄 Unlimited bandwidth
- 📈 Auto-scaling

**URLs for your music bot:**
```
https://your-worker.workers.dev/audio/:videoId
https://your-worker.workers.dev/video/:videoId
```

📖 **Full Guide:** See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)  
🇮🇳 **Hindi Guide:** See [USAGE_GUIDE.md](./USAGE_GUIDE.md)

### Option 3: Deploying to Vercel

### Important Note About Vercel Deployment

⚠️ **Vercel has timeout limitations (10-60 seconds depending on plan) which may affect long-running operations like video downloads.** For production use, consider deploying to platforms that support long-running processes like Railway, Heroku, or DigitalOcean.

### Vercel Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Configure Environment Variables on Vercel**:
   
   Go to your project dashboard on Vercel or use the CLI:
   ```bash
   vercel env add BOT_TOKEN
   vercel env add OWNER_ID
   vercel env add AUDIO_CHANNEL_ID
   vercel env add VIDEO_CHANNEL_ID
   vercel env add MONGODB_URI
   vercel env add YOUTUBE_API_KEY
   ```

   Or add them in the Vercel dashboard under Project Settings → Environment Variables.

4. **Deploy**:
   ```bash
   vercel
   ```

   For production:
   ```bash
   vercel --prod
   ```

5. **Set Webhook for Telegram Bot** (after deployment):
   
   Replace `YOUR_VERCEL_URL` with your actual Vercel deployment URL:
   ```bash
   curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
        -H "Content-Type: application/json" \
        -d '{"url": "https://YOUR_VERCEL_URL/api/webhook"}'
   ```

### Alternative: Deploy Button

You can also use this button to deploy to Vercel directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

Make sure to set all environment variables in the Vercel dashboard after deployment.

## Security Features

- **Owner-Only Access**: Only the configured OWNER_ID can use the bot
- **Access Control**: All other users receive an "Access Denied" message
- **Command Logging**: All commands are logged with user information
- **Restart Protection**: Only the owner can restart the bot

### Examples

```
/get dQw4w9WgXcQ
/get https://www.youtube.com/watch?v=dQw4w9WgXcQ
dQw4w9WgXcQ
```

## API Endpoints

### GET /audio/:videoId
Stream audio file for the specified video ID.

**Example:** `GET /audio/dQw4w9WgXcQ`

### GET /video/:videoId
Stream video file for the specified video ID.

**Example:** `GET /video/dQw4w9WgXcQ`

### GET /info/:videoId
Get video information from the database.

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "audioUrl": "/audio/dQw4w9WgXcQ",
  "videoUrl": "/video/dQw4w9WgXcQ",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastAccessed": "2024-01-01T00:00:00.000Z"
}
```

### GET /list?page=1&limit=50
List all processed videos with pagination.

**Response:**
```json
{
  "videos": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

### GET /health
Health check endpoint.

## How It Works

1. **User sends YouTube video ID** to the bot
2. **Bot checks MongoDB** for existing entry
3. **If cached:** Immediately sends files from Telegram using stored file_ids
4. **If new:**
   - Downloads audio and video using ytdl-core
   - Uploads audio to Audio Channel → gets `audio_file_id`
   - Uploads video to Video Channel → gets `video_file_id`
   - Saves metadata (video_id, title, file_ids) to MongoDB
   - Sends files to user
   - Cleans up temporary downloads
5. **API endpoints** securely stream files by:
   - Fetching fresh file URLs from Telegram using file_ids
   - Proxying the content without exposing bot token
   - Supporting caching and range requests

## Database Schema

```javascript
{
  videoId: String,        // YouTube video ID (unique)
  title: String,          // Video title
  audioFileId: String,    // Telegram file ID for audio
  videoFileId: String,    // Telegram file ID for video
  createdAt: Date,        // First download time
  lastAccessed: Date      // Last access time
}
```

**Note:** File IDs are permanent identifiers used to retrieve files from Telegram. URLs are generated on-demand for security.

## Error Handling

The system includes comprehensive error handling:
- Invalid video IDs are rejected
- Download failures are reported to the user
- Upload errors trigger retry mechanisms
- Database connection issues are logged
- API errors return proper HTTP status codes

## Security Notes

- Never commit your `.env` file
- Keep your bot token secure
- Use environment variables for all secrets
- Bot token is never exposed in API responses - files are proxied securely
- Non-ASCII characters in video titles are safely sanitized
- File streaming uses server-side proxying to protect credentials

## Performance

- **Caching:** Duplicate requests are instant (no re-download)
- **Parallel Processing:** Audio and video download/upload in parallel
- **Cleanup:** Temporary files are automatically removed
- **Indexing:** MongoDB indexes for fast lookups

## Limitations

- YouTube videos must be publicly accessible
- File size limits depend on Telegram's restrictions
- API rate limits apply to Telegram and YouTube

## Recent Improvements (Nov 2025)

### YouTube Download Library - Migration to play-dl

**November 2025 Update:** This project now uses **`play-dl`** instead of `@distube/ytdl-core` for YouTube downloads.

**Why the change?**
- ✅ **More reliable:** `@distube/ytdl-core` was experiencing frequent parsing errors due to YouTube changes
- ✅ **Actively maintained:** `play-dl` is built specifically to handle YouTube's anti-bot measures
- ✅ **Better performance:** Faster downloads with fewer errors
- ✅ **Production-ready:** Works reliably on both Replit and Render deployments

**What play-dl provides:**
- Stable YouTube video/audio downloads
- Automatic handling of YouTube's API changes
- No browser headers or complex bypass techniques needed
- Built-in format selection and quality control
- Works with ffmpeg for audio conversion

**For Render deployment:**
- All dependencies are in package.json (no system deps needed)
- No binary tools required (like yt-dlp command-line)
- Works out of the box after deployment
- ffmpeg is installed automatically by Render
- Reliable downloads without parsing errors

## Troubleshooting

### YouTube download errors (parsing, bot detection, etc.)
- ✅ **Fixed in latest version** - migrated to `play-dl` library
- Make sure you have the latest code from this repository
- Ensure all packages are installed: `npm install`
- `play-dl` is more stable and actively maintained for YouTube downloads

### Bot not responding
- Check if BOT_TOKEN is correct
- Verify bot is running with no errors
- Ensure MongoDB connection is active

### Upload failures
- Verify bot is admin in both channels
- Check channel IDs are correct (include @ or -100 prefix)
- Ensure files are within Telegram's size limits

### Download errors
- Verify video is publicly accessible
- Check ytdl-core version compatibility
- Some videos may have restrictions
- Age-restricted videos may need cookies.txt file

## License

ISC
