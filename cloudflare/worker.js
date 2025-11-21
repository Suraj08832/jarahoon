const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleTelegramWebhook(request, env) {
  try {
    const update = await request.json();
    
    // Forward webhook to main server (Replit)
    const response = await fetch(`${env.MAIN_SERVER_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    
    // Propagate the response from main server
    if (!response.ok) {
      console.error('Main server webhook failed:', response.status);
      return new Response('Webhook processing failed', { status: response.status });
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Health check
  if (path === '/health' || path === '/') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      endpoints: {
        audio: '/audio/:videoId',
        video: '/video/:videoId',
        info: '/info/:videoId',
        list: '/list?page=1&limit=50'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Audio endpoint
  if (path.startsWith('/audio/')) {
    const videoId = path.split('/audio/')[1];
    return handleAudioRequest(videoId, env);
  }
  
  // Video endpoint
  if (path.startsWith('/video/')) {
    const videoId = path.split('/video/')[1];
    return handleVideoRequest(videoId, env);
  }
  
  // Info endpoint
  if (path.startsWith('/info/')) {
    const videoId = path.split('/info/')[1];
    return handleInfoRequest(videoId, env);
  }
  
  // List endpoint
  if (path.startsWith('/list')) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    return handleListRequest(page, limit, env);
  }
  
  return new Response('Not Found', { status: 404 });
}

async function handleAudioRequest(videoId, env) {
  try {
    // Get video data from main server API
    const infoResponse = await fetch(`${env.MAIN_SERVER_URL}/api/info/${videoId}`);
    
    if (!infoResponse.ok) {
      return new Response(JSON.stringify({ error: 'Audio not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const videoData = await infoResponse.json();
    
    if (!videoData.audioFileId) {
      return new Response(JSON.stringify({ error: 'Audio file not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Get file from Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${videoData.audioFileId}`
    );
    const data = await response.json();
    
    if (!data.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get file from Telegram' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${data.result.file_path}`;
    
    // Proxy the file with caching
    const fileResponse = await fetch(fileUrl);
    
    return new Response(fileResponse.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `inline; filename="${videoId}.mp3"`,
        'Cache-Control': 'public, max-age=31536000',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Audio request error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleVideoRequest(videoId, env) {
  try {
    // Get video data from main server API
    const infoResponse = await fetch(`${env.MAIN_SERVER_URL}/api/info/${videoId}`);
    
    if (!infoResponse.ok) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const videoData = await infoResponse.json();
    
    if (!videoData.videoFileId) {
      return new Response(JSON.stringify({ error: 'Video file not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const response = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${videoData.videoFileId}`
    );
    const data = await response.json();
    
    if (!data.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get file from Telegram' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${data.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    
    return new Response(fileResponse.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${videoId}.mp4"`,
        'Cache-Control': 'public, max-age=31536000',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Video request error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleInfoRequest(videoId, env) {
  try {
    // Proxy request to main server
    const response = await fetch(`${env.MAIN_SERVER_URL}/api/info/${videoId}`);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleListRequest(page, limit, env) {
  try {
    // Proxy request to main server
    const response = await fetch(`${env.MAIN_SERVER_URL}/api/list?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch list' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Telegram webhook endpoint
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }
    
    // API endpoints
    return handleApiRequest(request, env);
  }
};
