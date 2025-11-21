class BotMiddleware {
  constructor(ownerId) {
    this.ownerId = ownerId.toString();
  }

  isOwner(ctx) {
    return ctx.from && ctx.from.id.toString() === this.ownerId;
  }

  async ownerOnly(ctx, next) {
    if (!ctx.from) {
      return ctx.reply('❌ Unable to verify user identity.');
    }

    if (ctx.from.id.toString() !== this.ownerId) {
      return ctx.reply('⛔ Access Denied!\n\nThis bot is private and only accessible to the owner.');
    }

    return next();
  }

  async logCommand(ctx, next) {
    if (ctx.message && ctx.message.text) {
      console.log(`[${new Date().toISOString()}] User ${ctx.from?.id} (${ctx.from?.username || 'N/A'}): ${ctx.message.text}`);
    }
    return next();
  }
}

module.exports = BotMiddleware;
