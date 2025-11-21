class BotHandlers {
  constructor(bot, env) {
    this.bot = bot;
    this.env = env;
  }

  async handleStart(ctx) {
    const userName = ctx.from?.first_name || ctx.from?.username || 'User';
    await ctx.reply(
      `🎬 Welcome ${userName}!\n\n` +
      '🔒 This is a private bot.\n\n' +
      'Send me a YouTube video ID, URL, or song name and I will:\n' +
      '1. Download the audio and video\n' +
      '2. Upload them to Telegram channels\n' +
      '3. Give you streaming URLs for your music bot\n\n' +
      '📝 Commands:\n' +
      '/song <song name> - Search and download by song name\n' +
      '/get <video_id> - Download by video ID or URL\n' +
      '/info <video_id> - Get video information\n\n' +
      '💡 Examples:\n' +
      '/song never gonna give you up\n' +
      '/get dQw4w9WgXcQ\n' +
      'Or just send: "Crush hu tera song tu hai kahan"'
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
    await ctx.reply('⚠️ Bot processing is only available on the main server.\n\n' +
      'This Cloudflare Worker only serves API endpoints for streaming.\n\n' +
      'Available endpoints:\n' +
      '• /audio/:videoId - Stream audio\n' +
      '• /video/:videoId - Stream video\n' +
      '• /info/:videoId - Get video info\n\n' +
      'Use the main bot to download videos first.');
  }

  async handleSong(ctx) {
    await ctx.reply('⚠️ Song search is only available on the main server.\n\n' +
      'This Cloudflare Worker serves API endpoints.\n\n' +
      'Use the main bot to search and download songs.');
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

    await ctx.reply(
      `📊 API Endpoints for ${videoId}:\n\n` +
      `🎵 Audio: ${this.env.WORKER_URL}/audio/${videoId}\n` +
      `🎥 Video: ${this.env.WORKER_URL}/video/${videoId}\n` +
      `ℹ️ Info: ${this.env.WORKER_URL}/info/${videoId}\n\n` +
      'Use these URLs in your music bot!'
    );
  }
}

export default BotHandlers;
