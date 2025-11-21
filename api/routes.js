const express = require('express');
const axios = require('axios');
const Video = require('../db/model');
const downloader = require('../bot/youtube');
const { Telegraf } = require('telegraf');
const TelegramUploader = require('../bot/uploader');

const router = express.Router();

let bot = null;
let uploader = null;

const processingVideos = new Map();

// Function to clean and normalize video ID
function cleanVideoId(videoId) {
  if (!videoId) return null;
  
  // Remove any prefixes like "0_", "1_", etc.
  let cleaned = videoId.trim();
  
  // If it has underscore, take the part after the last underscore
  if (cleaned.includes('_')) {
    const parts = cleaned.split('_');
    cleaned = parts[parts.length - 1];
  }
  
  // Extract 11-character YouTube video ID
  // YouTube video IDs are exactly 11 characters
  const youtubeIdPattern = /([a-zA-Z0-9_-]{11})/;
  const match = cleaned.match(youtubeIdPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // If it's already 11 characters, return as is
  if (cleaned.length === 11) {
    return cleaned;
  }
  
  // Try to extract from URL patterns
  const urlPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of urlPatterns) {
    const urlMatch = cleaned.match(pattern);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
  }
  
  return cleaned;
}

function initializeBotForAPI() {
  if (!bot) {
    bot = new Telegraf(process.env.BOT_TOKEN.trim());
    uploader = new TelegramUploader(bot);
  }
  return { bot, uploader };
}

async function processAndSaveVideo(videoId) {
  if (processingVideos.has(videoId)) {
    console.log(`⏳ Video ${videoId} is already being processed, waiting...`);
    return await processingVideos.get(videoId);
  }
  
  const processingPromise = (async () => {
    try {
      console.log(`🔄 Auto-processing video ${videoId} via API request...`);
      
      const existingVideo = await Video.findOne({ videoId });
      if (existingVideo) {
        console.log(`✅ Video ${videoId} already in database (race condition avoided)`);
        return existingVideo;
      }
      
      const { uploader } = initializeBotForAPI();
      
      const result = await downloader.download(videoId);
      
      console.log(`📤 Uploading files to Telegram channels...`);
      const uploadResult = await uploader.uploadToChannels(
        result.audioPath,
        result.videoPath,
        result.title
      );
      
      const video = new Video({
        videoId: videoId,
        title: result.title,
        audioFileId: uploadResult.audioFileId,
        videoFileId: uploadResult.videoFileId
      });
      
      await video.save();
      console.log(`✅ Video ${videoId} processed and saved to database`);
      
      await downloader.cleanup(result.audioPath, result.videoPath);
      
      return video;
    } catch (error) {
      console.error(`❌ Failed to auto-process video ${videoId}:`, error.message);
      throw error;
    } finally {
      processingVideos.delete(videoId);
    }
  })();
  
  processingVideos.set(videoId, processingPromise);
  return await processingPromise;
}

async function getTelegramFileUrl(fileId) {
  try {
    if (!fileId) {
      throw new Error('File ID is missing');
    }

    const botToken = process.env.BOT_TOKEN.trim();
    
    console.log(`📥 Fetching file info for file_id: ${fileId.substring(0, 20)}...`);
    
    let fileResponse;
    try {
      fileResponse = await axios.get(
        `https://api.telegram.org/bot${botToken}/getFile`,
        { 
          params: { file_id: fileId },
          timeout: 15000,
          validateStatus: () => true
        }
      );
    } catch (err) {
      console.error('Axios error:', err.message);
      throw err;
    }
    
    if (!fileResponse.data.ok) {
      console.error('Telegram API error:', fileResponse.data);
      const errorMsg = fileResponse.data.description || 'Failed to get file info';
      
      if (errorMsg.includes('wrong file_id') || errorMsg.includes('temporarily unavailable')) {
        const error = new Error(errorMsg);
        error.code = 'FILE_EXPIRED';
        throw error;
      }
      
      throw new Error(`Telegram API error: ${errorMsg}`);
    }
    
    const filePath = fileResponse.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    return fileUrl;
  } catch (error) {
    console.error('❌ Error in getTelegramFileUrl:', error.message);
    throw error;
  }
}

async function streamTelegramFile(fileId, res) {
  try {
    const fileUrl = await getTelegramFileUrl(fileId);
    
    console.log(`🌐 Streaming file from Telegram: ${fileUrl.substring(0, 50)}...`);
    
    const fileStream = await axios.get(fileUrl, {
      responseType: 'stream',
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    const contentType = fileStream.headers['content-type'] || 'application/octet-stream';
    const contentLength = fileStream.headers['content-length'];
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    
    if (contentLength) {
      res.set('Content-Length', contentLength);
    }
    
    return new Promise((resolve, reject) => {
      fileStream.data.pipe(res);
      
      fileStream.data.on('end', () => {
        console.log('✅ File stream completed successfully');
        resolve();
      });
      
      fileStream.data.on('error', (error) => {
        console.error('❌ Stream error:', error);
        fileStream.data.destroy();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error', message: error.message });
        } else {
          res.destroy();
        }
        reject(error);
      });
      
      res.on('error', (error) => {
        console.error('❌ Response error:', error);
        fileStream.data.destroy();
        reject(error);
      });
      
      res.on('close', () => {
        if (!res.writableEnded) {
          console.log('⚠️  Client disconnected before stream finished');
          fileStream.data.destroy();
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error in streamTelegramFile:', error.message);
    throw error;
  }
}

router.get('/audio/:videoId', async (req, res) => {
  const startTime = Date.now();
  let { videoId } = req.params;
  
  try {
    console.log(`🎵 Audio request received for videoId: ${videoId}`);
    
    const forceStream = req.query.stream === 'true' || req.query.stream === '1';
    
    // Detect if request is from API client (not browser) - More aggressive detection
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';
    
    // Always stream for API clients - check multiple indicators
    const isApiClient = forceStream ||
                       userAgent.includes('python') ||
                       userAgent.includes('aiohttp') ||
                       userAgent.includes('requests') ||
                       userAgent.includes('curl') ||
                       userAgent.includes('Postman') ||
                       userAgent.includes('http') ||
                       userAgent.toLowerCase().includes('bot') ||
                       (!userAgent.includes('Mozilla') && 
                        !userAgent.includes('Chrome') && 
                        !userAgent.includes('Safari') && 
                        !userAgent.includes('Firefox') &&
                        !userAgent.includes('Edge') &&
                        !userAgent.includes('Opera') &&
                        userAgent.length > 0) ||
                       (acceptHeader && !acceptHeader.includes('text/html'));
    
    console.log(`🔍 Request type: ${isApiClient ? 'API Client' : 'Browser'} | User-Agent: ${userAgent.substring(0, 80)} | Accept: ${acceptHeader.substring(0, 50)}`);
    
    // Clean the video ID
    const originalVideoId = videoId;
    videoId = cleanVideoId(videoId);
    
    if (originalVideoId !== videoId) {
      console.log(`🧹 Cleaned video ID: ${originalVideoId} -> ${videoId}`);
    }
    
    if (!videoId || videoId.length !== 11) {
      console.error(`❌ Invalid video ID: ${req.params.videoId} (cleaned: ${videoId})`);
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters. Received: ' + req.params.videoId
      });
    }
    
    console.log(`🔎 Checking database for video: ${videoId}`);
    let video = await Video.findOne({ videoId });
    
    if (!video) {
      console.log(`📥 Video ${videoId} not found in database, auto-processing...`);
      
      try {
        video = await processAndSaveVideo(videoId);
        console.log(`✅ Video ${videoId} processed successfully`);
      } catch (processError) {
        console.error(`❌ Failed to process video ${videoId}:`, processError);
        return res.status(500).json({
          error: 'Processing failed',
          message: 'Failed to download and process this video: ' + processError.message,
          videoId: videoId
        });
      }
    } else {
      console.log(`✅ Video ${videoId} found in database: ${video.title}`);
    }

    video.lastAccessed = new Date();
    await video.save();

    // If API client or forceStream is requested, always use streaming
    if (isApiClient || forceStream) {
      console.log(`📡 Streaming for API client: ${videoId}`);
      try {
        await streamTelegramFile(video.audioFileId, res);
        const duration = Date.now() - startTime;
        console.log(`✅ Audio stream completed for ${videoId} in ${duration}ms`);
        return;
      } catch (streamError) {
        console.error(`❌ Stream error for ${videoId}:`, streamError.message);
        if (streamError.code === 'FILE_EXPIRED') {
          console.log(`⚠️  File expired for ${videoId}, deleting and re-processing...`);
          await Video.deleteOne({ videoId });
          try {
            video = await processAndSaveVideo(videoId);
            await streamTelegramFile(video.audioFileId, res);
            const duration = Date.now() - startTime;
            console.log(`✅ Audio stream completed (after reprocess) for ${videoId} in ${duration}ms`);
            return;
          } catch (reprocessError) {
            console.error(`❌ Reprocessing failed for ${videoId}:`, reprocessError.message);
            if (!res.headersSent) {
              return res.status(500).json({
                error: 'Reprocessing failed',
                message: 'File expired and reprocessing failed: ' + reprocessError.message,
                videoId: videoId
              });
            }
          }
        }
        throw streamError;
      }
    }

    // If video is in DB and browser request, try redirecting directly to Telegram file URL
    try {
      const directUrl = await getTelegramFileUrl(video.audioFileId);
      console.log(`✅ Video ${videoId} found in DB, redirecting to direct URL`);
      return res.redirect(302, directUrl);
    } catch (urlError) {
      console.error(`❌ URL error for ${videoId}:`, urlError.message);
      if (urlError.code === 'FILE_EXPIRED') {
        console.log(`⚠️  File expired for ${videoId}, deleting and re-processing...`);
        
        await Video.deleteOne({ videoId });
        
        try {
          video = await processAndSaveVideo(videoId);
          const directUrl = await getTelegramFileUrl(video.audioFileId);
          return res.redirect(302, directUrl);
        } catch (reprocessError) {
          console.error(`❌ Reprocessing failed for ${videoId}:`, reprocessError.message);
          if (!res.headersSent) {
            return res.status(500).json({
              error: 'Reprocessing failed',
              message: 'File expired and reprocessing failed: ' + reprocessError.message,
              videoId: videoId
            });
          }
        }
      } else {
        // Fallback to streaming if redirect fails
        console.log(`⚠️  Redirect failed, falling back to streaming: ${urlError.message}`);
        try {
          await streamTelegramFile(video.audioFileId, res);
          const duration = Date.now() - startTime;
          console.log(`✅ Audio stream completed (fallback) for ${videoId} in ${duration}ms`);
        } catch (streamError) {
          console.error(`❌ Fallback stream error for ${videoId}:`, streamError.message);
          if (!res.headersSent) {
            throw streamError;
          }
        }
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error serving audio for ${videoId} (${duration}ms):`, error);
    console.error('Stack trace:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        videoId: videoId
      });
    } else {
      res.destroy();
    }
  }
});

router.get('/video/:videoId', async (req, res) => {
  try {
    let { videoId } = req.params;
    const forceStream = req.query.stream === 'true' || req.query.stream === '1';
    
    // Detect if request is from API client (not browser) - More aggressive detection
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';
    
    // Always stream for API clients - check multiple indicators
    const isApiClient = forceStream ||
                       userAgent.includes('python') ||
                       userAgent.includes('aiohttp') ||
                       userAgent.includes('requests') ||
                       userAgent.includes('curl') ||
                       userAgent.includes('Postman') ||
                       userAgent.includes('http') ||
                       userAgent.toLowerCase().includes('bot') ||
                       (!userAgent.includes('Mozilla') && 
                        !userAgent.includes('Chrome') && 
                        !userAgent.includes('Safari') && 
                        !userAgent.includes('Firefox') &&
                        !userAgent.includes('Edge') &&
                        !userAgent.includes('Opera') &&
                        userAgent.length > 0) ||
                       (acceptHeader && !acceptHeader.includes('text/html'));
    
    // Clean the video ID
    videoId = cleanVideoId(videoId);
    
    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters. Received: ' + req.params.videoId
      });
    }
    
    let video = await Video.findOne({ videoId });
    
    if (!video) {
      console.log(`📥 Video ${videoId} not found in database, auto-processing...`);
      
      try {
        video = await processAndSaveVideo(videoId);
      } catch (processError) {
        console.error('Failed to process video:', processError);
        return res.status(500).json({
          error: 'Processing failed',
          message: 'Failed to download and process this video: ' + processError.message,
          videoId: videoId
        });
      }
    }

    video.lastAccessed = new Date();
    await video.save();

    // If API client or forceStream is requested, always use streaming
    if (isApiClient || forceStream) {
      console.log(`📡 Streaming for API client: ${videoId} (User-Agent: ${userAgent.substring(0, 50)})`);
      try {
        await streamTelegramFile(video.videoFileId, res);
        return;
      } catch (streamError) {
        if (streamError.code === 'FILE_EXPIRED') {
          console.log(`⚠️  File expired for ${videoId}, deleting and re-processing...`);
          await Video.deleteOne({ videoId });
          try {
            video = await processAndSaveVideo(videoId);
            await streamTelegramFile(video.videoFileId, res);
            return;
          } catch (reprocessError) {
            if (!res.headersSent) {
              return res.status(500).json({
                error: 'Reprocessing failed',
                message: 'File expired and reprocessing failed: ' + reprocessError.message,
                videoId: videoId
              });
            }
          }
        }
        throw streamError;
      }
    }

    // If video is in DB and browser request, try redirecting directly to Telegram file URL
    try {
      const directUrl = await getTelegramFileUrl(video.videoFileId);
      console.log(`✅ Video ${videoId} found in DB, redirecting to direct URL`);
      return res.redirect(302, directUrl);
    } catch (urlError) {
      if (urlError.code === 'FILE_EXPIRED') {
        console.log(`⚠️  File expired for ${videoId}, deleting and re-processing...`);
        
        await Video.deleteOne({ videoId });
        
        try {
          video = await processAndSaveVideo(videoId);
          const directUrl = await getTelegramFileUrl(video.videoFileId);
          return res.redirect(302, directUrl);
        } catch (reprocessError) {
          if (!res.headersSent) {
            return res.status(500).json({
              error: 'Reprocessing failed',
              message: 'File expired and reprocessing failed: ' + reprocessError.message,
              videoId: videoId
            });
          }
        }
      } else {
        // Fallback to streaming if redirect fails
        console.log(`⚠️  Redirect failed, falling back to streaming: ${urlError.message}`);
        try {
          await streamTelegramFile(video.videoFileId, res);
        } catch (streamError) {
          if (!res.headersSent) {
            throw streamError;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error serving video:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    } else {
      res.destroy();
    }
  }
});

router.get('/info/:videoId', async (req, res) => {
  try {
    let { videoId } = req.params;
    
    // Clean the video ID
    videoId = cleanVideoId(videoId);
    
    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters. Received: ' + req.params.videoId
      });
    }
    
    const video = await Video.findOne({ videoId });
    
    if (video) {
      return res.json({
        videoId: video.videoId,
        title: video.title,
        audioFileId: video.audioFileId,
        videoFileId: video.videoFileId,
        audioUrl: `/audio/${video.videoId}`,
        videoUrl: `/video/${video.videoId}`,
        createdAt: video.createdAt,
        lastAccessed: video.lastAccessed,
        processed: true
      });
    }
    
    console.log(`📋 Video ${videoId} not in database, fetching info from YouTube...`);
    
    try {
      const info = await downloader.getVideoInfo(videoId);
      
      return res.json({
        videoId: videoId,
        title: info.title,
        duration: info.duration,
        author: info.author,
        audioUrl: `/audio/${videoId}`,
        videoUrl: `/video/${videoId}`,
        processed: false
      });
    } catch (infoError) {
      console.error(`Failed to get video info from YouTube for ${videoId}:`, infoError.message);
      return res.status(404).json({
        error: 'Video not found',
        message: 'Could not fetch video information from YouTube. The video might not exist or be unavailable.',
        details: infoError.message
      });
    }
  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('videoId title createdAt lastAccessed');

    const total = await Video.countDocuments();

    res.json({
      videos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/stream', async (req, res) => {
  try {
    const { streamUrl, videoId: providedVideoId, title, type } = req.body;
    
    if (!streamUrl && !providedVideoId) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Please provide either streamUrl or videoId in the request body'
      });
    }
    
    let videoId = providedVideoId;
    
    if (streamUrl) {
      console.log(`🔍 Extracting video ID from stream URL...`);
      
      const youtubePatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /googlevideo\.com.*[?&]id=([a-zA-Z0-9_-]{11})/,
        /manifest\.googlevideo\.com.*\/id\/([a-zA-Z0-9_-]+)\//
      ];
      
      for (const pattern of youtubePatterns) {
        const match = streamUrl.match(pattern);
        if (match && match[1]) {
          videoId = match[1];
          console.log(`✅ Extracted video ID from URL: ${videoId}`);
          break;
        }
      }
      
      if (!videoId) {
        const urlObj = new URL(streamUrl);
        const idParam = urlObj.searchParams.get('id');
        if (idParam) {
          videoId = idParam;
          console.log(`✅ Extracted video ID from query param: ${videoId}`);
        }
      }
      
      if (!videoId) {
        return res.status(400).json({
          error: 'Invalid stream URL',
          message: 'Could not extract video ID from the provided stream URL. Currently only YouTube URLs are supported. Please provide a YouTube video URL or pass the videoId directly.',
          streamUrl: streamUrl.substring(0, 100) + '...'
        });
      }
    }
    
    const cleanedVideoId = cleanVideoId(videoId);
    
    if (!cleanedVideoId || cleanedVideoId.length !== 11) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters. Extracted: ' + (cleanedVideoId || 'null'),
        providedVideoId: providedVideoId,
        streamUrl: streamUrl ? streamUrl.substring(0, 100) + '...' : null
      });
    }
    
    console.log(`🎬 Stream request for videoId: ${cleanedVideoId}, type: ${type || 'both'}`);
    if (streamUrl) {
      console.log(`📡 Stream URL provided: ${streamUrl.substring(0, 80)}...`);
    }
    
    let video = await Video.findOne({ videoId: cleanedVideoId });
    
    if (video) {
      console.log(`✅ Video ${cleanedVideoId} already exists in database`);
      return res.json({
        success: true,
        videoId: cleanedVideoId,
        title: video.title,
        audioUrl: `/audio/${cleanedVideoId}`,
        videoUrl: `/video/${cleanedVideoId}`,
        playUrl: `/play/${cleanedVideoId}`,
        message: 'Video already processed and available',
        cached: true
      });
    }
    
    console.log(`📥 Processing new stream for ${cleanedVideoId}...`);
    
    try {
      video = await processAndSaveVideo(cleanedVideoId);
      
      return res.json({
        success: true,
        videoId: cleanedVideoId,
        title: video.title,
        audioUrl: `/audio/${cleanedVideoId}`,
        videoUrl: `/video/${cleanedVideoId}`,
        playUrl: `/play/${cleanedVideoId}`,
        message: 'Video processed and saved successfully',
        cached: false
      });
    } catch (processError) {
      console.error(`❌ Failed to process stream for ${cleanedVideoId}:`, processError);
      return res.status(500).json({
        error: 'Processing failed',
        message: 'Failed to process this stream: ' + processError.message,
        videoId: cleanedVideoId
      });
    }
  } catch (error) {
    console.error('❌ Stream endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/play/:videoId', async (req, res) => {
  try {
    let { videoId } = req.params;
    const type = req.query.type || 'both';
    
    videoId = cleanVideoId(videoId);
    
    if (!videoId || videoId.length !== 11) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Video ID</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
            .error { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Invalid Video ID</h1>
            <p>Video ID must be 11 characters</p>
          </div>
        </body>
        </html>
      `);
    }
    
    const video = await Video.findOne({ videoId });
    const baseUrl = req.protocol + '://' + req.get('host');
    
    const playerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${video ? video.title : 'Video Player'} - YouTube Telegram Bot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 15px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 900px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .player-section {
      padding: 30px;
    }
    .media-container {
      background: #000;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    video, audio {
      width: 100%;
      display: block;
      background: #000;
    }
    video { max-height: 500px; }
    audio { height: 54px; }
    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .btn {
      padding: 15px 25px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      text-align: center;
      display: inline-block;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    .btn-secondary:hover { background: #e0e0e0; }
    .status {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .status.loading { background: #fff3cd; color: #856404; }
    .status.success { background: #d4edda; color: #155724; }
    .status.error { background: #f8d7da; color: #721c24; }
    .info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .info h3 { margin-bottom: 10px; color: #333; font-size: 18px; }
    .info p { color: #666; line-height: 1.6; margin-bottom: 8px; }
    .hidden { display: none; }
    @media (max-width: 600px) {
      .controls { grid-template-columns: 1fr; }
      .header h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎬 ${video ? video.title : 'Video Player'}</h1>
      <p>Stream audio and video from YouTube to Telegram</p>
    </div>
    
    <div class="player-section">
      <div id="status" class="status loading">
        Loading media...
      </div>
      
      <div id="videoContainer" class="media-container ${type === 'audio' ? 'hidden' : ''}">
        <video id="videoPlayer" controls controlsList="nodownload">
          <source src="${baseUrl}/video/${videoId}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div id="audioContainer" class="media-container ${type === 'video' ? 'hidden' : ''}">
        <audio id="audioPlayer" controls controlsList="nodownload">
          <source src="${baseUrl}/audio/${videoId}" type="audio/mpeg">
          Your browser does not support the audio tag.
        </audio>
      </div>
      
      <div class="controls">
        <button id="toggleVideo" class="btn btn-primary" onclick="toggleVideo()">
          ${type === 'audio' ? '📹 Show Video' : '🎵 Show Audio Only'}
        </button>
        <button class="btn btn-secondary" onclick="window.location.href='${baseUrl}'">
          🏠 Back to Home
        </button>
      </div>
      
      <div class="info">
        <h3>ℹ️ Information</h3>
        <p><strong>Video ID:</strong> ${videoId}</p>
        ${video ? `<p><strong>Title:</strong> ${video.title}</p>` : ''}
        ${video ? `<p><strong>Processed:</strong> ${new Date(video.createdAt).toLocaleString()}</p>` : ''}
        <p><strong>Audio URL:</strong> <a href="${baseUrl}/audio/${videoId}" target="_blank">${baseUrl}/audio/${videoId}</a></p>
        <p><strong>Video URL:</strong> <a href="${baseUrl}/video/${videoId}" target="_blank">${baseUrl}/video/${videoId}</a></p>
      </div>
    </div>
  </div>
  
  <script>
    const videoContainer = document.getElementById('videoContainer');
    const audioContainer = document.getElementById('audioContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    const status = document.getElementById('status');
    const toggleBtn = document.getElementById('toggleVideo');
    let showingVideo = ${type !== 'audio'};
    
    function toggleVideo() {
      showingVideo = !showingVideo;
      
      if (showingVideo) {
        videoContainer.classList.remove('hidden');
        audioContainer.classList.add('hidden');
        audioPlayer.pause();
        toggleBtn.innerHTML = '🎵 Show Audio Only';
      } else {
        videoContainer.classList.add('hidden');
        audioContainer.classList.remove('hidden');
        videoPlayer.pause();
        toggleBtn.innerHTML = '📹 Show Video';
      }
    }
    
    videoPlayer.addEventListener('loadeddata', () => {
      status.className = 'status success';
      status.textContent = '✅ Video loaded successfully';
    });
    
    audioPlayer.addEventListener('loadeddata', () => {
      if (status.textContent.includes('Loading')) {
        status.className = 'status success';
        status.textContent = '✅ Audio loaded successfully';
      }
    });
    
    videoPlayer.addEventListener('error', (e) => {
      console.error('Video error:', e);
      status.className = 'status error';
      status.textContent = '❌ Failed to load video. Trying to process...';
      setTimeout(() => location.reload(), 3000);
    });
    
    audioPlayer.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      status.className = 'status error';
      status.textContent = '❌ Failed to load audio. Trying to process...';
      setTimeout(() => location.reload(), 3000);
    });
    
    setTimeout(() => {
      if (status.textContent.includes('Loading')) {
        status.className = 'status loading';
        status.textContent = '⏳ Processing video... This may take a moment for first-time requests.';
      }
    }, 3000);
  </script>
</body>
</html>
    `;
    
    res.send(playerHtml);
  } catch (error) {
    console.error('❌ Player page error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
          .error { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ Error</h1>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `);
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Test endpoint to verify API is working
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    status: 'ok',
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    endpoints: {
      audio: '/audio/:videoId',
      video: '/video/:videoId',
      info: '/info/:videoId'
    },
    note: 'Use /audio/VIDEO_ID or /video/VIDEO_ID to stream files'
  });
});

// Public API endpoint - similar to external YouTube APIs
router.get('/song', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query parameter. Use: /song?query=VIDEO_ID'
      });
    }
    
    const cleaned = cleanVideoId(query);
    console.log(`🎵 API song request for: ${query} (cleaned: ${cleaned})`);
    
    let video = await Video.findOne({ videoId: cleaned });
    
    if (!video) {
      console.log(`📥 Video not in database, processing ${cleaned}...`);
      video = await processAndSaveVideo(cleaned);
    }
    
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : `http://localhost:${process.env.PORT || 5000}`;
    
    const audioLink = `${baseUrl}/audio/${cleaned}`;
    
    res.json({
      success: true,
      videoId: cleaned,
      title: video.title,
      link: audioLink,
      videoLink: `${baseUrl}/video/${cleaned}`,
      playLink: `${baseUrl}/play/${cleaned}`
    });
    
  } catch (error) {
    console.error('❌ API song endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process song',
      message: error.message
    });
  }
});

// Debug endpoint to check video status
router.get('/debug/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const cleaned = cleanVideoId(videoId);
    
    console.log(`🔍 Debug request for videoId: ${videoId} (cleaned: ${cleaned})`);
    
    const video = await Video.findOne({ videoId: cleaned });
    
    if (video) {
      res.json({
        found: true,
        videoId: video.videoId,
        title: video.title,
        hasAudioFileId: !!video.audioFileId,
        hasVideoFileId: !!video.videoFileId,
        audioFileId: video.audioFileId ? video.audioFileId.substring(0, 20) + '...' : null,
        videoFileId: video.videoFileId ? video.videoFileId.substring(0, 20) + '...' : null,
        createdAt: video.createdAt,
        lastAccessed: video.lastAccessed,
        audioUrl: `/audio/${cleaned}`,
        videoUrl: `/video/${cleaned}`
      });
    } else {
      res.json({
        found: false,
        videoId: cleaned,
        message: 'Video not in database. It will be processed on first request.',
        audioUrl: `/audio/${cleaned}`,
        videoUrl: `/video/${cleaned}`
      });
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
