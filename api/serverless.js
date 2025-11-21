require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }
  
  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });
  
  isConnected = true;
}

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

app.get('/', async (req, res) => {
  res.json({
    name: 'YouTube to Telegram Bot API',
    version: '1.0.0',
    platform: 'Vercel Serverless',
    endpoints: {
      audio: '/api/audio/:videoId - Get audio file info',
      video: '/api/video/:videoId - Get video file info',
      info: '/api/info/:videoId - Get video information',
      list: '/api/list?page=1&limit=50 - List all processed videos',
      health: '/api/health - Health check'
    },
    note: 'This is API-only. Telegram bot must run on Heroku/Render/Railway for continuous operation.',
    documentation: 'Process videos via Telegram bot, retrieve via API'
  });
});

app.get('/api', async (req, res) => {
  res.redirect('/');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'connected' : 'disconnected',
    platform: 'Vercel Serverless',
    mongooseState: mongoose.connection.readyState
  });
});

app.get('/api/audio/:videoId', async (req, res) => {
  try {
    await connectDB();
    const Video = require('../db/model');
    const { videoId } = req.params;
    
    const video = await Video.findOne({ videoId });
    
    if (!video || !video.audioFileId) {
      return res.status(404).json({ 
        error: 'Video not found',
        message: 'Please process this video via Telegram bot first.' 
      });
    }
    
    video.lastAccessed = new Date();
    await video.save();
    
    res.json({
      videoId,
      title: video.title,
      fileId: video.audioFileId,
      url: video.audioUrl,
      createdAt: video.createdAt,
      lastAccessed: video.lastAccessed
    });
  } catch (error) {
    console.error('Audio endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/video/:videoId', async (req, res) => {
  try {
    await connectDB();
    const Video = require('../db/model');
    const { videoId } = req.params;
    
    const video = await Video.findOne({ videoId });
    
    if (!video || !video.videoFileId) {
      return res.status(404).json({ 
        error: 'Video not found',
        message: 'Please process this video via Telegram bot first.' 
      });
    }
    
    video.lastAccessed = new Date();
    await video.save();
    
    res.json({
      videoId,
      title: video.title,
      fileId: video.videoFileId,
      url: video.videoUrl,
      createdAt: video.createdAt,
      lastAccessed: video.lastAccessed
    });
  } catch (error) {
    console.error('Video endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/info/:videoId', async (req, res) => {
  try {
    await connectDB();
    const Video = require('../db/model');
    const { videoId } = req.params;
    
    const video = await Video.findOne({ videoId });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found in database' });
    }
    
    res.json({
      videoId: video.videoId,
      title: video.title,
      audioFileId: video.audioFileId,
      videoFileId: video.videoFileId,
      audioUrl: video.audioUrl,
      videoUrl: video.videoUrl,
      createdAt: video.createdAt,
      lastAccessed: video.lastAccessed
    });
  } catch (error) {
    console.error('Info endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/list', async (req, res) => {
  try {
    await connectDB();
    const Video = require('../db/model');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const total = await Video.countDocuments();
    
    res.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.all('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/api/health', '/api/audio/:videoId', '/api/video/:videoId', '/api/info/:videoId', '/api/list']
  });
});

module.exports = app;
