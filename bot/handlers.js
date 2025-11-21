const Video = require('../db/model');
const youtubeDownloader = require('./youtube');
const youtubeSearch = require('./search');

class BotHandlers {
  constructor(bot, uploader) {
    this.bot = bot;
    this.uploader = uploader;
  }

  getDeployUrl() {
    return process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000';
  }

  formatVideoInfo(title, videoId) {
    const deployUrl = this.getDeployUrl();
    return `📊 Video Info:\n` +
      `Title: ${title}\n` +
      `Video ID: ${videoId}\n\n` +
      `🌐 Web Player:\n${deployUrl}/play/${videoId}\n\n` +
      `📡 API Endpoints:\n` +
      `Audio: ${deployUrl}/audio/${videoId}\n` +
      `Video: ${deployUrl}/video/${videoId}`;
  }

  async handleStart(ctx) {
    const userName = ctx.from?.first_name || ctx.from?.username || 'Owner';
    const deployUrl = process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000';
    
    await ctx.reply(
      `🎬 Welcome ${userName}!\n\n` +
      '🔒 This is a private bot for the owner only.\n\n' +
      'Send me a YouTube video ID or URL and I will:\n' +
      '1. Download the audio and video\n' +
      '2. Upload them to respective channels\n' +
      '3. Save them for future quick access\n' +
      '4. Provide web player link\n\n' +
      '📝 Commands:\n' +
      '/song <song name> - Search and download by song name\n' +
      '/get <video_id> - Download by video ID or URL\n' +
      '/play <video_id> - Get web player link\n' +
      '/info <video_id> - Get video information\n' +
      '/restart - Restart the bot (owner only)\n\n' +
      '💡 Examples:\n' +
      '/song never gonna give you up\n' +
      '/get dQw4w9WgXcQ\n' +
      '/play dQw4w9WgXcQ\n' +
      'Or just send a YouTube URL directly!\n\n' +
      `🌐 Web Player: ${deployUrl}`
    );
  }

  extractVideoId(input) {
    input = input.trim();
    
    if (input.length === 11 && !input.includes('/') && !input.includes('?')) {
      return input;
    }
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  async handleGet(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length === 0) {
      return ctx.reply('❌ Please provide a YouTube video ID or URL\nExample: /get dQw4w9WgXcQ');
    }

    const videoId = this.extractVideoId(args[0]);
    
    if (!videoId) {
      return ctx.reply('❌ Invalid YouTube video ID or URL');
    }

    const statusMsg = await ctx.reply('⏳ Processing your request...');

    try {
      const existingVideo = await Video.findOne({ videoId });

      if (existingVideo) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          '✅ Found in database! Sending cached files...'
        );

        await ctx.replyWithAudio(existingVideo.audioFileId, {
          caption: `🎵 Audio: ${existingVideo.title}`
        });

        await ctx.replyWithVideo(existingVideo.videoFileId, {
          caption: `🎥 Video: ${existingVideo.title}`
        });

        existingVideo.lastAccessed = new Date();
        await existingVideo.save();

        return ctx.reply(this.formatVideoInfo(existingVideo.title, videoId));
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '📥 Downloading from YouTube...'
      );

      const videoInfo = await youtubeDownloader.getVideoInfo(videoId);
      
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `📥 Downloading: ${videoInfo.title}`
      );

      const [audioPath, videoPath] = await Promise.all([
        youtubeDownloader.downloadAudio(videoId),
        youtubeDownloader.downloadVideo(videoId)
      ]);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '📤 Uploading to Telegram channels...'
      );

      const [audioResult, videoResult] = await Promise.all([
        this.uploader.uploadAudio(audioPath, process.env.AUDIO_CHANNEL_ID, videoInfo.title),
        this.uploader.uploadVideo(videoPath, process.env.VIDEO_CHANNEL_ID, videoInfo.title)
      ]);

      const newVideo = new Video({
        videoId,
        title: videoInfo.title,
        audioFileId: audioResult.fileId,
        videoFileId: videoResult.fileId
      });

      await newVideo.save();

      youtubeDownloader.cleanupFile(audioPath);
      youtubeDownloader.cleanupFile(videoPath);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '✅ Successfully processed! Sending files...'
      );

      await ctx.replyWithAudio(audioResult.fileId, {
        caption: `🎵 Audio: ${videoInfo.title}`
      });

      await ctx.replyWithVideo(videoResult.fileId, {
        caption: `🎥 Video: ${videoInfo.title}`
      });

      return ctx.reply(this.formatVideoInfo(videoInfo.title, videoId));

    } catch (error) {
      console.error('Error processing video:', error);
      
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `❌ Error: ${error.message}`
      );
    }
  }

  async handleInfo(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length === 0) {
      return ctx.reply('❌ Please provide a YouTube video ID\nExample: /info dQw4w9WgXcQ');
    }

    const videoId = this.extractVideoId(args[0]);
    
    if (!videoId) {
      return ctx.reply('❌ Invalid YouTube video ID or URL');
    }

    try {
      const videoInfo = await youtubeDownloader.getVideoInfo(videoId);
      const dbVideo = await Video.findOne({ videoId });

      let response = `📹 Video Information:\n\n` +
        `Title: ${videoInfo.title}\n` +
        `Author: ${videoInfo.author}\n` +
        `Duration: ${Math.floor(videoInfo.duration / 60)}m ${videoInfo.duration % 60}s\n` +
        `Video ID: ${videoId}\n\n`;

      if (dbVideo) {
        response += `✅ Cached in database\n` +
          `Last accessed: ${dbVideo.lastAccessed.toLocaleString()}\n` +
          `Created: ${dbVideo.createdAt.toLocaleString()}`;
      } else {
        response += `❌ Not yet cached\nUse /get ${videoId} to download and cache`;
      }

      await ctx.reply(response);
    } catch (error) {
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }

  async handleSong(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length === 0) {
      return ctx.reply('❌ Please provide a song name\nExample: /song never gonna give you up');
    }

    const query = args.join(' ');
    const statusMsg = await ctx.reply(`🔍 Searching for: "${query}"...`);

    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '🔍 Finding best match on YouTube...'
      );

      const result = await youtubeSearch.getFirstResult(query);
      const videoId = youtubeSearch.extractVideoId(result.url);

      if (!videoId) {
        return ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          '❌ Could not extract video ID from search result'
        );
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `✅ Found: ${result.title}\n👤 By: ${result.author}\n⏱ Duration: ${result.duration}\n\n⏳ Processing...`
      );

      const existingVideo = await Video.findOne({ videoId });

      if (existingVideo) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          '✅ Found in database! Sending cached files...'
        );

        await ctx.replyWithAudio(existingVideo.audioFileId, {
          caption: `🎵 Audio: ${existingVideo.title}`
        });

        await ctx.replyWithVideo(existingVideo.videoFileId, {
          caption: `🎥 Video: ${existingVideo.title}`
        });

        existingVideo.lastAccessed = new Date();
        await existingVideo.save();

        return ctx.reply(this.formatVideoInfo(existingVideo.title, videoId));
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `📥 Downloading: ${result.title}`
      );

      const videoInfo = await youtubeDownloader.getVideoInfo(videoId);

      const [audioPath, videoPath] = await Promise.all([
        youtubeDownloader.downloadAudio(videoId),
        youtubeDownloader.downloadVideo(videoId)
      ]);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '📤 Uploading to Telegram channels...'
      );

      const [audioResult, videoResult] = await Promise.all([
        this.uploader.uploadAudio(audioPath, process.env.AUDIO_CHANNEL_ID, videoInfo.title),
        this.uploader.uploadVideo(videoPath, process.env.VIDEO_CHANNEL_ID, videoInfo.title)
      ]);

      const newVideo = new Video({
        videoId,
        title: videoInfo.title,
        audioFileId: audioResult.fileId,
        videoFileId: videoResult.fileId
      });

      await newVideo.save();

      youtubeDownloader.cleanupFile(audioPath);
      youtubeDownloader.cleanupFile(videoPath);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '✅ Successfully processed! Sending files...'
      );

      await ctx.replyWithAudio(audioResult.fileId, {
        caption: `🎵 Audio: ${videoInfo.title}`
      });

      await ctx.replyWithVideo(videoResult.fileId, {
        caption: `🎥 Video: ${videoInfo.title}`
      });

      return ctx.reply(this.formatVideoInfo(videoInfo.title, videoId));

    } catch (error) {
      console.error('Error processing song:', error);
      
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `❌ Error: ${error.message}`
      );
    }
  }

  async handlePlay(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length === 0) {
      return ctx.reply('❌ Please provide a YouTube video ID or URL\nExample: /play dQw4w9WgXcQ');
    }

    const videoId = this.extractVideoId(args[0]);
    
    if (!videoId) {
      return ctx.reply('❌ Invalid YouTube video ID or URL');
    }

    try {
      const deployUrl = this.getDeployUrl();
      const playUrl = `${deployUrl}/play/${videoId}`;
      
      const video = await Video.findOne({ videoId });
      
      if (video) {
        await ctx.reply(
          `🌐 Web Player Link:\n\n` +
          `${playUrl}\n\n` +
          `📊 Video Info:\n` +
          `Title: ${video.title}\n` +
          `Video ID: ${videoId}\n\n` +
          `📡 Direct Links:\n` +
          `Audio: ${deployUrl}/audio/${videoId}\n` +
          `Video: ${deployUrl}/video/${videoId}\n\n` +
          `💡 Tip: Click the link above to play in your browser!`
        );
      } else {
        await ctx.reply(
          `🌐 Web Player Link:\n\n` +
          `${playUrl}\n\n` +
          `📊 Video ID: ${videoId}\n\n` +
          `⚠️ Note: This video hasn't been processed yet.\n` +
          `When you open the player link, it will automatically download and process the video.\n\n` +
          `Or use /get ${videoId} to process it now.`
        );
      }
    } catch (error) {
      console.error('Error in handlePlay:', error);
      await ctx.reply(`❌ Error: ${error.message}`);
    }
  }
}

module.exports = BotHandlers;
