require('dotenv').config();
const mongoose = require('mongoose');
const initializeBot = require('./bot');

async function main() {
  try {
    console.log('🔧 Starting Telegram Bot (Bot Only Mode)...');

    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN is not defined in environment variables');
    }

    if (!process.env.AUDIO_CHANNEL_ID) {
      throw new Error('AUDIO_CHANNEL_ID is not defined in environment variables');
    }

    if (!process.env.VIDEO_CHANNEL_ID) {
      throw new Error('VIDEO_CHANNEL_ID is not defined in environment variables');
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    if (!process.env.OWNER_ID) {
      throw new Error('OWNER_ID is not defined in environment variables');
    }

    const botToken = process.env.BOT_TOKEN.trim();
    const ownerId = process.env.OWNER_ID.trim();
    console.log(`🔐 Bot configured for owner ID: ${ownerId}`);
    const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
    if (!tokenPattern.test(botToken)) {
      console.error('⚠️  BOT_TOKEN format appears invalid');
      console.error('Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
      console.error('Token length:', botToken.length);
      throw new Error('BOT_TOKEN format is invalid. Please check your token from @BotFather');
    }

    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    console.log('🤖 Initializing Telegram bot...');
    const bot = initializeBot();
    
    const gracefulShutdown = async (signal = 'MANUAL') => {
      console.log(`\n🛑 Shutting down gracefully (${signal})...`);
      bot.stop(signal);
      await mongoose.connection.close();
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    };
    
    global.gracefulShutdown = gracefulShutdown;
    
    bot.launch({
      dropPendingUpdates: true
    }).then(() => {
      console.log('✅ Telegram bot is running');
      console.log('🎉 Bot is operational!');
      console.log('📝 Bot commands:');
      console.log('   /start - Welcome message');
      console.log('   /get <video_id> - Download and process YouTube video');
      console.log('   /info <video_id> - Get video information');
    }).catch((error) => {
      console.error('❌ Failed to launch Telegram bot:', error.message);
      if (error.response) {
        console.error('Response:', error.response);
      }
      console.error('\n⚠️  Please verify:');
      console.error('1. Your BOT_TOKEN is correct (get it from @BotFather)');
      console.error('2. The token format is: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
      console.error('3. There are no extra spaces or characters in the token');
      process.exit(1);
    });

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
