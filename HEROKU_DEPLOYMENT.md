# Heroku Deployment Guide

This guide will help you deploy the YouTube Telegram Bot to Heroku.

## Prerequisites

1. [Heroku Account](https://signup.heroku.com/)
2. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
3. MongoDB Atlas account (free tier available)
4. Telegram bot token from @BotFather
5. YouTube API key from Google Cloud Console

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

This method uses Docker containers and includes all system dependencies (yt-dlp, ffmpeg).

#### Step 1: Login to Heroku
```bash
heroku login
```

#### Step 2: Create Heroku App
```bash
heroku create your-youtube-bot
```

#### Step 3: Set Stack to Container
```bash
heroku stack:set container -a your-youtube-bot
```

#### Step 4: Set Environment Variables
```bash
heroku config:set BOT_TOKEN="your_bot_token_here" -a your-youtube-bot
heroku config:set OWNER_ID="your_telegram_user_id" -a your-youtube-bot
heroku config:set AUDIO_CHANNEL_ID="your_audio_channel_id" -a your-youtube-bot
heroku config:set VIDEO_CHANNEL_ID="your_video_channel_id" -a your-youtube-bot
heroku config:set MONGODB_URI="your_mongodb_connection_string" -a your-youtube-bot
heroku config:set YOUTUBE_API_KEY="your_youtube_api_key" -a your-youtube-bot
```

#### Step 4.1: Set YouTube Cookies (REQUIRED - Avoid Bot Detection)
**⚠️ CRITICAL**: YouTube blocks downloads from Heroku IPs. You MUST provide cookies to avoid "Sign in to confirm you're not a bot" errors.

1. Export YouTube cookies using browser extension (see [COOKIES_SETUP.md](COOKIES_SETUP.md) for detailed instructions)
2. Ensure cookies are in JSON format
3. Set cookies as environment variable:

```bash
# Option 1: From cookies.json file
heroku config:set YOUTUBE_COOKIES="$(cat cookies.json)" -a your-youtube-bot

# Option 2: Direct JSON string
heroku config:set YOUTUBE_COOKIES='[{"name":"VISITOR_INFO1_LIVE","value":"xxx","domain":".youtube.com"},{"name":"CONSENT","value":"xxx","domain":".youtube.com"}]' -a your-youtube-bot
```

#### Step 5: Deploy
```bash
git push heroku main
```

#### Step 6: Scale Dynos
```bash
heroku ps:scale web=1 -a your-youtube-bot
```

### Method 2: Buildpack Deployment

This method uses Heroku buildpacks to install dependencies.

#### Step 1: Login to Heroku
```bash
heroku login
```

#### Step 2: Create Heroku App
```bash
heroku create your-youtube-bot
```

#### Step 3: Add Buildpacks
```bash
heroku buildpacks:add --index 1 heroku/python -a your-youtube-bot
heroku buildpacks:add --index 2 https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git -a your-youtube-bot
heroku buildpacks:add --index 3 heroku/nodejs -a your-youtube-bot
```

#### Step 4: Set Environment Variables
```bash
heroku config:set BOT_TOKEN="your_bot_token_here" -a your-youtube-bot
heroku config:set OWNER_ID="your_telegram_user_id" -a your-youtube-bot
heroku config:set AUDIO_CHANNEL_ID="your_audio_channel_id" -a your-youtube-bot
heroku config:set VIDEO_CHANNEL_ID="your_video_channel_id" -a your-youtube-bot
heroku config:set MONGODB_URI="your_mongodb_connection_string" -a your-youtube-bot
heroku config:set YOUTUBE_API_KEY="your_youtube_api_key" -a your-youtube-bot
```

#### Step 4.1: Set YouTube Cookies (REQUIRED - Avoid Bot Detection)
**⚠️ CRITICAL**: YouTube blocks downloads from Heroku IPs. You MUST provide cookies to avoid "Sign in to confirm you're not a bot" errors.

1. Export YouTube cookies using browser extension (see [COOKIES_SETUP.md](COOKIES_SETUP.md) for detailed instructions)
2. Ensure cookies are in JSON format
3. Set cookies as environment variable:

```bash
# Option 1: From cookies.json file
heroku config:set YOUTUBE_COOKIES="$(cat cookies.json)" -a your-youtube-bot

# Option 2: Direct JSON string
heroku config:set YOUTUBE_COOKIES='[{"name":"VISITOR_INFO1_LIVE","value":"xxx","domain":".youtube.com"},{"name":"CONSENT","value":"xxx","domain":".youtube.com"}]' -a your-youtube-bot
```

#### Step 5: Create requirements.txt
Create a file named `requirements.txt` in the root directory:
```
yt-dlp
```

#### Step 6: Deploy
```bash
git add .
git commit -m "Add Heroku deployment files"
git push heroku main
```

#### Step 7: Scale Dynos
```bash
heroku ps:scale web=1 -a your-youtube-bot
```

## One-Click Deploy

Click the button below to deploy directly to Heroku (requires app.json configuration):

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `OWNER_ID` | Your Telegram user ID | `8115787127` |
| `AUDIO_CHANNEL_ID` | Channel ID for audio storage | `@yourchannel` or `-100XXXXX` |
| `VIDEO_CHANNEL_ID` | Channel ID for video storage | `@yourchannel` or `-100XXXXX` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | `AIzaSyXXXXXXXXXXXXXXXXXX` |
| `YOUTUBE_COOKIES` | **REQUIRED** YouTube cookies in JSON format | `[{"name":"VISITOR_INFO1_LIVE","value":"xxx"...}]` |
| `PORT` | API server port (auto-set by Heroku) | `5000` |

## Getting Required Credentials

### 1. Telegram Bot Token
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token provided

### 2. Telegram Channel IDs
1. Create two Telegram channels (one for audio, one for video)
2. Add your bot as an admin to both channels
3. Use the channel username (`@yourchannel`) or numeric ID (`-100XXXXX`)

### 3. MongoDB Connection String
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get the connection string
5. Replace `<password>` with your database password

### 4. YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key

### 5. Your Telegram User ID
1. Open Telegram and search for @userinfobot
2. Send `/start` to get your user ID

## Post-Deployment

### View Logs
```bash
heroku logs --tail -a your-youtube-bot
```

### Restart App
```bash
heroku restart -a your-youtube-bot
```

### Scale Dynos
```bash
# Start the bot
heroku ps:scale web=1 -a your-youtube-bot

# Stop the bot
heroku ps:scale web=0 -a your-youtube-bot
```

### Open App
```bash
heroku open -a your-youtube-bot
```

## Troubleshooting

### Bot Not Responding
1. Check logs: `heroku logs --tail -a your-youtube-bot`
2. Verify all environment variables are set correctly
3. Ensure bot is admin in both Telegram channels
4. Check MongoDB connection

### Out of Memory
Heroku free dyno has 512MB RAM limit. Consider:
1. Upgrading to Hobby dyno ($7/month)
2. Reducing video quality settings
3. Implementing better file cleanup

### Download Failures
1. Verify yt-dlp is installed (check logs)
2. Ensure ffmpeg is available
3. Check YouTube API quota limits

## Cost

- **Free Tier**: 550-1000 dyno hours/month (enough for 24/7 operation with one dyno)
- **Hobby Tier**: $7/month per dyno (no sleep, better performance)
- **MongoDB Atlas**: Free tier available (512MB storage)

## Important Notes

1. **Free dynos sleep after 30 minutes of inactivity** - The keep-alive system will prevent this
2. **File storage is ephemeral** - All downloads are temporary and deleted after upload to Telegram
3. **No persistent storage** - All data stored in MongoDB, not on Heroku filesystem
4. **550 free dyno hours/month** - Add credit card for 1000 hours/month

## Support

For issues, check:
1. Heroku logs: `heroku logs --tail`
2. Bot commands work via Telegram
3. API endpoint: `https://your-app-name.herokuapp.com/`

## Files Added

- `Procfile` - Tells Heroku how to run the app
- `Dockerfile` - Container configuration with all dependencies
- `heroku.yml` - Docker deployment configuration
- `.dockerignore` - Excludes unnecessary files from Docker build
- `app.json` - One-click deploy configuration
- `HEROKU_DEPLOYMENT.md` - This guide
