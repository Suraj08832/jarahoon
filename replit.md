# YouTube to Telegram Bot System

## Overview
A Node.js-based Telegram bot and API system that downloads YouTube videos, separates audio and video, uploads them to different Telegram channels, stores metadata in MongoDB, and serves content via public API endpoints. The system includes intelligent caching to avoid re-downloading duplicate requests.

## Recent Changes
- **November 15, 2025**: Landing page and stream play functionality
  - **Landing Page**: Beautiful web interface at root URL (/) for easy music management
  - **URL Input Form**: Paste YouTube URLs directly to add songs to database
  - **Recent Videos List**: View and play all cached songs from the homepage
  - **POST /stream Endpoint**: API endpoint to process YouTube stream URLs and extract video IDs
  - **GET /play/:videoId**: Full-featured web player with audio/video controls and toggle
  - **Bot /play Command**: New Telegram command to get web player links
  - **Smart User-Agent Detection**: Serves HTML for browsers, JSON for API clients
  - **Auto-Open Player**: Landing page automatically opens player after processing
  - **Responsive Design**: Mobile-friendly interface with gradient styling
  - **API Documentation**: Built-in API docs on landing page
- **November 12, 2025**: Advanced YouTube bot detection bypass with play-dl
  - **Critical Fix**: Migrated from @distube/ytdl-core to play-dl library
  - **Problem Solved**: YouTube "Sign in to confirm you're not a bot" errors
  - **Security Improvement**: Removed expired hardcoded cookies
  - **Advanced Bypass**: play-dl uses sophisticated bot detection evasion
  - **Better Reliability**: Mimics real browser behavior with proper user-agents
  - **Format Handling**: Improved video quality selection (720p/360p)
  - **Error Handling**: Better error messages and automatic retries
  - **Status**: Fully implemented and code verified
- **November 12, 2025**: Complete deployment support for all platforms
  - **Heroku Support**: Dockerfile, Procfile, heroku.yml, app.json for complete bot deployment
  - **Vercel Support**: api/serverless.js and updated vercel.json for API-only deployment
  - **Important**: Vercel can ONLY host API (serverless), bot must run on Heroku/Render/Railway
  - **Deployment Guides**: HEROKU_DEPLOYMENT.md and VERCEL_DEPLOYMENT.md with detailed instructions
  - **Architecture**: Two-tier setup - Bot on Heroku + API on Vercel for optimal performance
  - **Bot Working**: Successfully tested with /song command and file streaming
  - **Format Fix**: Updated yt-dlp format selector to use specific format IDs (229+233)
- **November 11, 2025**: Auto-processing API and automatic file recovery
  - **Auto-Processing**: API automatically downloads/uploads videos not in database when requested
  - **Race Condition Protection**: `processingVideos` Map prevents duplicate downloads from concurrent requests
  - **Automatic Recovery**: Expired Telegram file_ids are automatically detected, deleted, and re-processed
  - **Singleton Pattern**: Fixed downloader usage to use exported instance (not class instantiation)
  - **Improved Error Handling**: streamTelegramFile properly bubbles errors to route handlers
  - **Production-Ready**: All changes reviewed and approved by architect for deployment
- **November 11, 2025**: Render deployment and production-ready improvements
  - Created render.yaml for Render platform deployment
  - Implemented keep-alive system (auto-ping every 5 minutes to prevent sleep)
  - Fixed critical 500 errors in audio/video streaming endpoints
  - Added proper stream error handling and cleanup (prevents hanging responses)
  - Enhanced timeout handling (120 seconds for large files)
  - Added CORS headers for cross-origin music bot integration
  - Improved logging for better debugging and monitoring
  - Updated README with Render deployment instructions and environment setup
- **November 11, 2025**: Cloudflare Workers deployment and music bot integration
  - Created Cloudflare Workers configuration for global edge deployment
  - Built edge CDN layer for audio/video streaming with caching
  - Added Hindi usage guide (USAGE_GUIDE.md) for music bot integration
  - Updated API to expose file IDs for Worker compatibility
  - Implemented two-tier architecture (Replit origin + Cloudflare edge)
  - Added comprehensive deployment documentation (CLOUDFLARE_DEPLOYMENT.md)
- **November 11, 2025**: YouTube API integration and Vercel deployment setup
  - Integrated YouTube Data API v3 for advanced song search
  - Replaced ytsr with official YouTube API for better search accuracy
  - Added YOUTUBE_API_KEY environment variable configuration
  - Created vercel.json for Vercel deployment support
  - Updated documentation with Vercel deployment instructions
  - Added .env.example with YouTube API key template
- **November 11, 2025**: Song search and FFmpeg integration
  - Added YouTube search functionality using ytsr
  - Implemented /song command to download by song name
  - Integrated FFmpeg for high-quality MP3 audio conversion (128kbps)
  - Enhanced audio processing with libmp3lame codec
  - Added progress messages for search and download operations
- **November 11, 2025**: Enhanced security and features
  - Added owner-only access control (OWNER_ID: 8115787127)
  - Implemented /restart command for bot management
  - Integrated YouTube cookies for improved download reliability
  - Added command logging and user verification
  - Fixed security issues with BOT_TOKEN exposure
  - Implemented file proxying instead of direct URL redirects
- **November 11, 2025**: Initial project setup
  - Created complete bot system with Telegraf
  - Implemented YouTube downloader using ytdl-core
  - Built Telegram uploader for dual-channel storage
  - Created MongoDB schema for video metadata
  - Developed Express API with streaming endpoints
  - Added smart caching system for duplicate requests

## Project Architecture

### Technology Stack
- **Runtime**: Node.js 20
- **Bot Framework**: Telegraf 4.15.0
- **YouTube Download**: yt-dlp (system package, actively maintained)
- **YouTube Search**: YouTube Data API v3 (official API)
- **Audio Processing**: FFmpeg (system package)
- **Database**: MongoDB with Mongoose 8.0.3
- **API Server**: Express.js 4.18.2
- **Environment**: dotenv for configuration
- **Deployment**: Vercel-ready configuration

### Directory Structure
```
/bot
├── index.js          # Telegraf bot initialization
├── handlers.js       # Command handlers (/start, /get, /song, /info)
├── youtube.js        # YouTube downloader with yt-dlp + FFmpeg
├── search.js         # YouTube search with YouTube Data API v3
├── uploader.js       # Telegram channel uploader
└── middleware.js     # Owner verification and logging

/api
├── index.js          # Express server setup
└── routes.js         # API endpoints (/audio, /video, /info, /list)

/db
└── model.js          # MongoDB schema for video metadata

/utils
└── keepAlive.js      # Auto-ping system to prevent service sleep

/downloads            # Temporary storage (auto-cleanup)

index.js              # Main entry point
render.yaml           # Render deployment configuration
vercel.json           # Vercel deployment configuration
.env.example          # Environment variables template
cookies.txt           # YouTube cookies (optional)
```

### Key Features
1. **YouTube API Search**: Official YouTube Data API v3 for accurate song search
2. **Song Search**: Find and download YouTube videos by song name with metadata
3. **High-Quality Audio**: FFmpeg conversion to MP3 (128kbps libmp3lame)
4. **Dual-Channel Upload**: Audio and video stored in separate Telegram channels
5. **Smart Caching**: Duplicate requests use stored Telegram file_ids
6. **Parallel Processing**: Audio and video download/upload simultaneously
7. **Public API**: Stream files via Telegram CDN
8. **Metadata Tracking**: MongoDB stores all video information
9. **Auto Cleanup**: Temporary files removed after upload
10. **Vercel Ready**: Configured for easy deployment to Vercel

### System Flow

#### /song Command Flow:
1. User sends song name to bot
2. Search YouTube using ytsr for best match
3. Extract video ID from first result
4. Check MongoDB for existing entry
5. If cached: Resend from Telegram using file_ids
6. If new: Proceed to download flow

#### /get Command Flow:
1. User sends YouTube video ID or URL to bot
2. Check MongoDB for existing entry
3. If cached: Resend from Telegram using file_ids
4. If new:
   - Download audio (WebM) and video with ytdl-core
   - Convert audio to MP3 using FFmpeg (128kbps)
   - Upload to respective Telegram channels
   - Store file_ids and metadata in MongoDB
   - Send to user
   - Clean up temporary files

## Configuration

### Required Environment Variables
- `BOT_TOKEN`: Telegram bot token from @BotFather
- `OWNER_ID`: Telegram user ID of the owner (only this user can access the bot)
- `AUDIO_CHANNEL_ID`: Telegram channel for audio files (@channelname or -100XXXXX)
- `VIDEO_CHANNEL_ID`: Telegram channel for video files (@channelname or -100XXXXX)
- `MONGODB_URI`: MongoDB connection string
- `YOUTUBE_API_KEY`: YouTube Data API v3 key (for song search functionality)
- `PORT`: API server port (default: 5000)

### Optional Files
- `cookies.txt`: YouTube cookies in Netscape format for improved downloads

### Setup Steps
1. Create Telegram bot via @BotFather
2. Create two Telegram channels for audio and video
3. Add bot as admin to both channels
4. Set up MongoDB database (Atlas or local)
5. Configure environment variables in `.env`
6. Install dependencies: `npm install`
7. Run: `npm start`

## API Endpoints

### GET /
API documentation and available endpoints

### GET /audio/:videoId
Stream audio file via Telegram CDN
- Returns: Redirect to Telegram file URL
- Example: `/audio/dQw4w9WgXcQ`

### GET /video/:videoId
Stream video file via Telegram CDN
- Returns: Redirect to Telegram file URL
- Example: `/video/dQw4w9WgXcQ`

### GET /info/:videoId
Get video metadata from database
- Returns: JSON with title, URLs, timestamps

### GET /list?page=1&limit=50
List all processed videos with pagination
- Returns: JSON array of videos with metadata

### GET /health
Health check endpoint
- Returns: System status

## Bot Commands

- `/start` - Welcome message and instructions
- `/song <song name>` - Search YouTube and download by song name (uses YouTube API)
- `/get <video_id>` - Download by video ID or URL
- `/info <video_id>` - Get video information from database
- `/restart` - Restart the bot (owner only)
- Direct input: Send YouTube URL or video ID
- **Text search**: Simply type a song/video name and the bot will search and download

**Examples:**
- `/song never gonna give you up`
- `/get dQw4w9WgXcQ`
- Send: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Type: `Crush hu tera song tu hai kahan`

## Security Features

- **Owner-Only Access**: Bot only responds to the configured OWNER_ID
- **Access Denial**: All other users receive "Access Denied" message
- **Command Logging**: All user interactions are logged with timestamps
- **Secure File Streaming**: BOT_TOKEN never exposed in API responses
- **Restart Protection**: Only owner can restart the bot

## Database Schema

```javascript
Video {
  videoId: String (unique, indexed),
  title: String,
  audioFileId: String,
  videoFileId: String,
  audioUrl: String,
  videoUrl: String,
  createdAt: Date,
  lastAccessed: Date
}
```

## Dependencies

### Node.js Packages
- telegraf: Telegram bot framework
- express: Web server framework
- mongoose: MongoDB ODM
- dotenv: Environment variable management
- axios: HTTP client for YouTube API

### System Packages (Nix)
- yt-dlp: YouTube video/audio downloader (actively maintained, handles YouTube changes)
- ffmpeg: Audio/video processing (conversion, merging)

## System Requirements
- yt-dlp (installed via Nix)
- FFmpeg (installed via Nix)

## User Preferences
- None specified yet

## Notes
- Bot requires admin access to both Telegram channels
- Temporary files automatically cleaned after upload
- MongoDB connection required for operation
- API server binds to 0.0.0.0:5000 for public access
- File size limited by Telegram restrictions (2GB for bots)
