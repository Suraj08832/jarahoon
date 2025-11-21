const fs = require('fs');

class TelegramUploader {
  constructor(bot) {
    this.bot = bot;
  }

  sanitizeFilename(title) {
    return title
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  async uploadAudio(filePath, channelId, title) {
    const sanitizedTitle = this.sanitizeFilename(title);
    
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }
      
      const audioStream = fs.createReadStream(filePath);
      
      const message = await this.bot.telegram.sendAudio(channelId, {
        source: audioStream,
        filename: `${sanitizedTitle}.mp3`
      }, {
        title: sanitizedTitle,
        performer: 'YouTube'
      });

      return {
        fileId: message.audio.file_id,
        fileUniqueId: message.audio.file_unique_id
      };
    } catch (error) {
      throw new Error(`Failed to upload audio to Telegram: ${error.message}`);
    }
  }

  async uploadVideo(filePath, channelId, title) {
    const sanitizedTitle = this.sanitizeFilename(title);
    
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Video file not found: ${filePath}`);
      }
      
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > 50) {
        throw new Error(`File too large (${fileSizeMB.toFixed(1)}MB). Telegram's limit is 50MB.`);
      }
      
      const videoStream = fs.createReadStream(filePath);
      
      const message = await this.bot.telegram.sendVideo(channelId, {
        source: videoStream,
        filename: `${sanitizedTitle}.mp4`
      }, {
        caption: sanitizedTitle,
        supports_streaming: true
      });

      return {
        fileId: message.video.file_id,
        fileUniqueId: message.video.file_unique_id
      };
    } catch (error) {
      throw new Error(`Failed to upload video to Telegram: ${error.message}`);
    }
  }

  async uploadToChannels(audioPath, videoPath, title) {
    try {
      const audioChannelId = process.env.AUDIO_CHANNEL_ID;
      const videoChannelId = process.env.VIDEO_CHANNEL_ID;

      console.log(`📤 Uploading audio to channel ${audioChannelId}...`);
      const audioResult = await this.uploadAudio(audioPath, audioChannelId, title);
      
      console.log(`📤 Uploading video to channel ${videoChannelId}...`);
      const videoResult = await this.uploadVideo(videoPath, videoChannelId, title);

      return {
        audioFileId: audioResult.fileId,
        videoFileId: videoResult.fileId
      };
    } catch (error) {
      throw new Error(`Failed to upload to channels: ${error.message}`);
    }
  }
}

module.exports = TelegramUploader;
