# Vercel Deployment Guide

## ⚠️ Important Notice

**Vercel CAN ONLY host the API, NOT the Telegram bot.**

### Why?

- **Vercel** = Serverless functions (runs on-demand, 10-60 second timeout)
- **Telegram Bot** = Long-running process (needs to run 24/7)

### Solution

Deploy in **two parts**:
1. **Telegram Bot** → Deploy on Heroku/Render/Railway (see HEROKU_DEPLOYMENT.md)
2. **API Only** → Deploy on Vercel (this guide)

---

## Vercel Deployment (API Only)

### Prerequisites

1. Vercel account (free tier available)
2. MongoDB Atlas connection string
3. Telegram bot already running on another platform (Heroku/Render)

### Option 1: Deploy with Vercel CLI

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel
```

#### Step 4: Set Environment Variables
```bash
vercel env add MONGODB_URI
# Paste your MongoDB connection string
```

#### Step 5: Redeploy
```bash
vercel --prod
```

### Option 2: Deploy via GitHub

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

#### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - `MONGODB_URI` = Your MongoDB connection string
5. Click "Deploy"

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/youtube-telegram-bot)

---

## Environment Variables (Vercel)

Only **MONGODB_URI** is required for Vercel deployment:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

**Note:** Bot-related variables (BOT_TOKEN, OWNER_ID, etc.) are NOT needed on Vercel since the bot doesn't run here.

---

## API Endpoints

After deployment, your Vercel API will be available at: `https://your-project.vercel.app/api/`

### Available Endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /` | API documentation |
| `GET /api/health` | Health check |
| `GET /api/audio/:videoId` | Get audio file info |
| `GET /api/video/:videoId` | Get video file info |
| `GET /api/info/:videoId` | Get video metadata |
| `GET /api/list?page=1&limit=50` | List all videos |

### Example Usage:

```bash
# Check health
curl https://your-project.vercel.app/api/health

# Get video info
curl https://your-project.vercel.app/api/info/dQw4w9WgXcQ

# List videos
curl https://your-project.vercel.app/api/list?page=1&limit=10
```

---

## Complete Setup (Bot + API)

### Architecture:

```
┌─────────────────────────────────────────────┐
│  User sends /song to Telegram               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Telegram Bot (Heroku/Render/Railway)       │
│  - Processes YouTube downloads              │
│  - Uploads to Telegram channels             │
│  - Saves metadata to MongoDB                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  MongoDB Atlas (Cloud Database)             │
│  - Stores video metadata                    │
│  - Stores Telegram file IDs                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Vercel API (Serverless)                    │
│  - Serves video metadata via REST API       │
│  - Fast, globally distributed               │
└─────────────────────────────────────────────┘
```

### Setup Steps:

1. **Deploy Telegram Bot** (Heroku):
   ```bash
   # See HEROKU_DEPLOYMENT.md
   heroku create my-telegram-bot
   git push heroku main
   ```

2. **Deploy API** (Vercel):
   ```bash
   vercel --prod
   ```

3. **Set up MongoDB Atlas**:
   - Create cluster at mongodb.com/cloud/atlas
   - Get connection string
   - Add to both Heroku and Vercel

4. **Test**:
   - Send `/song never gonna give you up` to Telegram bot
   - Check API: `curl https://your-vercel-app.vercel.app/api/list`

---

## Limitations

### Vercel Free Tier:
- ✅ Serverless Functions: Unlimited
- ✅ Bandwidth: 100 GB/month
- ✅ Deployments: Unlimited
- ⚠️ Function Execution: 10 seconds max (Hobby tier)
- ⚠️ Function Memory: 1024 MB

### What Works on Vercel:
- ✅ API endpoints (read database, serve JSON)
- ✅ Static file hosting
- ✅ Edge functions

### What DOESN'T Work on Vercel:
- ❌ Telegram bot (needs continuous running)
- ❌ Long-running processes
- ❌ WebSocket connections
- ❌ File downloads/processing (use bot on Heroku)

---

## Troubleshooting

### Error: Function Invocation Failed

**Cause:** Bot is trying to run on Vercel (not supported)

**Solution:** 
1. Deploy bot on Heroku: See `HEROKU_DEPLOYMENT.md`
2. Deploy only API on Vercel (already configured)

### Error: MONGODB_URI not defined

**Solution:**
```bash
vercel env add MONGODB_URI
# Enter your connection string
vercel --prod
```

### Error: Timeout

**Cause:** Serverless functions have 10-60 second limits

**Solution:** Vercel is only for API queries, not processing. Process videos via Telegram bot on Heroku.

---

## Recommended Setup

**Best practice:**

1. **Heroku** → Telegram Bot (continuous running)
   - Processes YouTube downloads
   - Handles user commands
   - Uploads to Telegram

2. **Vercel** → API (serverless, fast)
   - Serves cached video data
   - Global CDN distribution
   - Automatic scaling

3. **MongoDB Atlas** → Database (cloud)
   - Stores all metadata
   - Free tier: 512MB storage
   - Auto-backup

**Total Cost:** $0 (all free tiers) or $7/month (Heroku Hobby dyno for better reliability)

---

## Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Heroku Deployment Guide](./HEROKU_DEPLOYMENT.md)

---

## Support

For Vercel-specific issues:
- Check deployment logs in Vercel dashboard
- Verify environment variables are set
- Ensure MongoDB connection string is correct

For bot issues:
- Check Heroku logs (bot should run there, not Vercel)
- See HEROKU_DEPLOYMENT.md
