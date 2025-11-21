const express = require('express');
const routes = require('./routes');

function initializeAPI() {
  const app = express();
  const port = process.env.PORT || 5000;

  app.use(express.json());
  
  // Middleware to handle trailing slashes and normalize URLs
  app.use((req, res, next) => {
    // Remove trailing slashes except for root
    if (req.path !== '/' && req.path.endsWith('/')) {
      return res.redirect(301, req.path.slice(0, -1) + (req.query ? '?' + new URLSearchParams(req.query).toString() : ''));
    }
    next();
  });
  
  // Request logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📥 [${timestamp}] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);
    next();
  });

  app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get('/', (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';
    
    const isBrowser = acceptHeader.includes('text/html') || 
                     userAgent.includes('Mozilla') || 
                     userAgent.includes('Chrome') || 
                     userAgent.includes('Safari');
    
    if (isBrowser) {
      return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube Music Bot - Stream & Download</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
      padding: 40px 20px;
    }
    .header h1 {
      font-size: 48px;
      margin-bottom: 10px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .header p {
      font-size: 20px;
      opacity: 0.95;
    }
    .card {
      background: white;
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .input-section {
      margin-bottom: 25px;
    }
    .input-section h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 24px;
    }
    .input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    input[type="text"] {
      flex: 1;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    .status {
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      display: none;
    }
    .status.show { display: block; }
    .status.success { background: #d4edda; color: #155724; }
    .status.error { background: #f8d7da; color: #721c24; }
    .status.loading { background: #fff3cd; color: #856404; }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .feature {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
      text-align: center;
    }
    .feature-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }
    .feature h3 {
      color: #333;
      margin-bottom: 8px;
      font-size: 18px;
    }
    .feature p {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
    .video-list {
      margin-top: 20px;
    }
    .video-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .video-info {
      flex: 1;
    }
    .video-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }
    .video-id {
      font-size: 12px;
      color: #666;
    }
    .video-actions {
      display: flex;
      gap: 10px;
    }
    .btn-small {
      padding: 8px 16px;
      font-size: 14px;
    }
    .api-docs {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    .api-docs h3 {
      color: #333;
      margin-bottom: 15px;
    }
    .endpoint {
      background: white;
      padding: 10px 15px;
      border-radius: 5px;
      margin-bottom: 10px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .endpoint strong {
      color: #667eea;
    }
    @media (max-width: 768px) {
      .header h1 { font-size: 32px; }
      .input-group { flex-direction: column; }
      .features { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 YouTube Music Bot</h1>
      <p>Download, Stream & Play Music Instantly</p>
    </div>

    <div class="card">
      <div class="input-section">
        <h2>📥 Add Music</h2>
        <p style="color: #666; margin-bottom: 15px;">Paste a YouTube URL or Video ID to download and stream</p>
        <div class="input-group">
          <input 
            type="text" 
            id="urlInput" 
            placeholder="Enter YouTube URL or Video ID (e.g., dQw4w9WgXcQ or https://www.youtube.com/watch?v=...)"
          />
          <button class="btn btn-primary" onclick="processUrl()">
            🎵 Add Song
          </button>
        </div>
        <div id="status" class="status"></div>
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">🎵</div>
          <h3>Audio Streaming</h3>
          <p>High-quality audio streaming from Telegram servers</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📹</div>
          <h3>Video Playback</h3>
          <p>Full video support with built-in player</p>
        </div>
        <div class="feature">
          <div class="feature-icon">💾</div>
          <h3>Smart Caching</h3>
          <p>Instant access to previously downloaded content</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🤖</div>
          <h3>Telegram Bot</h3>
          <p>Control everything via Telegram commands</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 style="margin-bottom: 20px;">📚 Recent Videos</h2>
      <div id="videoList" class="video-list">
        <p style="color: #666; text-align: center;">Loading...</p>
      </div>
    </div>

    <div class="card">
      <h2 style="margin-bottom: 15px;">📡 API Endpoints</h2>
      <div class="api-docs">
        <div class="endpoint"><strong>GET</strong> ${baseUrl}/song?query=VIDEO_ID - Get download links (Public API)</div>
        <div class="endpoint"><strong>GET</strong> ${baseUrl}/play/:videoId - Web player</div>
        <div class="endpoint"><strong>GET</strong> ${baseUrl}/audio/:videoId - Stream audio</div>
        <div class="endpoint"><strong>GET</strong> ${baseUrl}/video/:videoId - Stream video</div>
        <div class="endpoint"><strong>POST</strong> ${baseUrl}/stream - Process stream URL</div>
        <div class="endpoint"><strong>GET</strong> ${baseUrl}/info/:videoId - Get video info</div>
        <div class="endpoint"><strong>GET</strong> ${baseUrl}/list - List all videos</div>
      </div>
      <p style="margin-top: 15px; color: #666;">
        <strong>📚 Integration:</strong> Check <a href="https://github.com/YOUR-REPO/tree/main/examples" style="color: #667eea;">examples/</a> folder for Python, Node.js, and PHP integration code.
      </p>
    </div>
  </div>

  <script>
    const baseUrl = window.location.origin;

    async function loadVideos() {
      try {
        const response = await fetch(baseUrl + '/list?limit=10');
        const data = await response.json();
        
        const videoList = document.getElementById('videoList');
        
        if (data.videos && data.videos.length > 0) {
          videoList.innerHTML = data.videos.map(video => \`
            <div class="video-item">
              <div class="video-info">
                <div class="video-title">\${video.title}</div>
                <div class="video-id">ID: \${video.videoId}</div>
              </div>
              <div class="video-actions">
                <a href="${baseUrl}/play/\${video.videoId}" class="btn btn-primary btn-small" target="_blank">
                  ▶️ Play
                </a>
                <a href="${baseUrl}/audio/\${video.videoId}" class="btn btn-secondary btn-small" target="_blank">
                  🎵 Audio
                </a>
              </div>
            </div>
          \`).join('');
        } else {
          videoList.innerHTML = '<p style="color: #666; text-align: center;">No videos yet. Add your first song above!</p>';
        }
      } catch (error) {
        console.error('Failed to load videos:', error);
        document.getElementById('videoList').innerHTML = '<p style="color: #721c24; text-align: center;">Failed to load videos</p>';
      }
    }

    async function processUrl() {
      const input = document.getElementById('urlInput');
      const status = document.getElementById('status');
      const url = input.value.trim();
      
      if (!url) {
        showStatus('Please enter a YouTube URL or Video ID', 'error');
        return;
      }

      showStatus('Processing... Please wait', 'loading');

      try {
        const response = await fetch(baseUrl + '/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamUrl: url })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showStatus(\`✅ Success! \${data.title || 'Video'} is ready\`, 'success');
          input.value = '';
          loadVideos();
          
          setTimeout(() => {
            window.open(baseUrl + '/play/' + data.videoId, '_blank');
          }, 1000);
        } else {
          showStatus(\`❌ Error: \${data.message || 'Failed to process'}\`, 'error');
        }
      } catch (error) {
        showStatus('❌ Network error. Please try again.', 'error');
        console.error('Process error:', error);
      }
    }

    function showStatus(message, type) {
      const status = document.getElementById('status');
      status.textContent = message;
      status.className = 'status show ' + type;
    }

    document.getElementById('urlInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        processUrl();
      }
    });

    loadVideos();
  </script>
</body>
</html>
      `);
    }
    
    res.json({
      name: 'YouTube to Telegram Bot API',
      version: '2.0.0',
      status: 'online',
      baseUrl: baseUrl,
      endpoints: {
        song: `${baseUrl}/song?query=VIDEO_ID - Public API to get download links (e.g., ${baseUrl}/song?query=dQw4w9WgXcQ)`,
        play: `${baseUrl}/play/:videoId - Web player for audio and video (e.g., ${baseUrl}/play/dQw4w9WgXcQ)`,
        audio: `${baseUrl}/audio/:videoId - Stream audio file (e.g., ${baseUrl}/audio/dQw4w9WgXcQ)`,
        video: `${baseUrl}/video/:videoId - Stream video file (e.g., ${baseUrl}/video/dQw4w9WgXcQ)`,
        stream: `${baseUrl}/stream - POST endpoint to process stream URLs`,
        info: `${baseUrl}/info/:videoId - Get video information (e.g., ${baseUrl}/info/dQw4w9WgXcQ)`,
        list: `${baseUrl}/list?page=1&limit=50 - List all processed videos`,
        health: `${baseUrl}/health - Health check`
      },
      documentation: 'Send a YouTube video ID to the Telegram bot to process and cache videos. Then use the API endpoints to stream them.',
      usage: {
        play_example: `Open ${baseUrl}/play/dQw4w9WgXcQ in your browser to play audio and video`,
        stream_example: `curl -X POST ${baseUrl}/stream -H "Content-Type: application/json" -d '{"streamUrl":"https://...", "videoId":"dQw4w9WgXcQ"}'`,
        audio_example: `curl ${baseUrl}/audio/dQw4w9WgXcQ`,
        note: 'Video IDs are automatically cleaned (removes prefixes like "0_"). Just use the 11-character YouTube video ID.'
      },
      features: [
        '🎵 Audio streaming from Telegram',
        '📹 Video streaming from Telegram',
        '🌐 Web player for browser playback',
        '💾 Automatic caching in database',
        '🔄 Auto-processing on first request',
        '📡 Stream URL support via POST /stream'
      ]
    });
  });

  app.use('/', routes);

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist'
    });
  });

  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 API server running on http://0.0.0.0:${port}`);
      resolve(server);
    });
  });
}

module.exports = initializeAPI;
