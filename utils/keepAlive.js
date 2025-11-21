const axios = require('axios');

class KeepAlive {
  constructor() {
    this.interval = null;
    this.pingUrl = null;
  }

  start() {
    if (this.interval) {
      console.log('⚠️  Keep-alive already running, skipping duplicate start');
      return;
    }

    // Heroku detection
    if (process.env.HEROKU_APP_NAME || process.env.DYNO) {
      // On Heroku, use the app URL from environment or construct it
      const herokuUrl = process.env.HEROKU_APP_URL || 
                       (process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : null);
      
      if (herokuUrl) {
        this.pingUrl = `${herokuUrl}/health`;
        console.log(`🔔 Heroku detected - Starting keep-alive ping to: ${this.pingUrl}`);
      } else {
        // Fallback: ping localhost (Heroku will route it)
        this.pingUrl = `http://localhost:${process.env.PORT || 5000}/health`;
        console.log(`🔔 Heroku detected (no URL) - Starting keep-alive ping to: ${this.pingUrl}`);
      }
    } else if (process.env.RENDER) {
      const renderUrl = process.env.RENDER_EXTERNAL_URL;
      if (renderUrl) {
        this.pingUrl = `${renderUrl}/health`;
        console.log(`🔔 Render detected - Starting keep-alive ping to: ${this.pingUrl}`);
      } else {
        console.log('⚠️  RENDER_EXTERNAL_URL not found, keep-alive disabled on Render');
        return;
      }
    } else if (process.env.REPLIT_DEPLOYMENT) {
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPLIT_DEV_DOMAIN;
      if (domain) {
        this.pingUrl = `https://${domain}/health`;
        console.log(`🔔 Replit detected - Starting keep-alive ping to: ${this.pingUrl}`);
      }
    } else {
      this.pingUrl = `http://localhost:${process.env.PORT || 5000}/health`;
      console.log(`🔔 Local environment - Starting keep-alive ping to: ${this.pingUrl}`);
    }

    if (this.pingUrl) {
      this.interval = setInterval(() => {
        this.ping();
      }, 5 * 60 * 1000);
      
      console.log('✅ Keep-alive system started (ping every 5 minutes)');
      
      setTimeout(() => {
        this.ping();
      }, 30000);
    }
  }

  async ping() {
    if (!this.pingUrl) return;

    try {
      const response = await axios.get(this.pingUrl, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        console.log(`💓 Keep-alive ping successful at ${new Date().toISOString()}`);
      } else {
        console.log(`⚠️  Keep-alive ping returned status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error.message);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.pingUrl = null;
      console.log('🛑 Keep-alive system stopped');
    }
  }
}

module.exports = new KeepAlive();
