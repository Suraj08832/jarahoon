const { Telegraf } = require('telegraf');
const TelegramUploader = require('./uploader');
const BotHandlers = require('./handlers');
const BotMiddleware = require('./middleware');

function initializeBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN.trim());
  const uploader = new TelegramUploader(bot);
  const handlers = new BotHandlers(bot, uploader);
  const middleware = new BotMiddleware(process.env.OWNER_ID || '0');

  bot.use(middleware.logCommand.bind(middleware));
  bot.use(middleware.ownerOnly.bind(middleware));

  bot.command('start', (ctx) => handlers.handleStart(ctx));
  bot.command('get', (ctx) => handlers.handleGet(ctx));
  bot.command('song', (ctx) => handlers.handleSong(ctx));
  bot.command('play', (ctx) => handlers.handlePlay(ctx));
  bot.command('info', (ctx) => handlers.handleInfo(ctx));
  
  bot.command('restart', async (ctx) => {
    await ctx.reply('🔄 Restarting bot... Please wait a moment.');
    console.log(`[${new Date().toISOString()}] Bot restart requested by owner (${ctx.from.id})`);
    
    setTimeout(async () => {
      if (global.gracefulShutdown) {
        await global.gracefulShutdown('RESTART');
      } else {
        console.error('Graceful shutdown function not available, forcing exit');
        process.exit(0);
      }
    }, 1000);
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    
    if (!text.startsWith('/')) {
      const videoId = handlers.extractVideoId(text);
      if (videoId) {
        ctx.message.text = `/get ${videoId}`;
        return handlers.handleGet(ctx);
      }
    }
  });

  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    if (ctx && ctx.reply) {
      ctx.reply('❌ An error occurred. Please try again later.');
    }
  });

  return bot;
}

module.exports = initializeBot;
