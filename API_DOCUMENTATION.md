# 🎵 YouTube Music Bot API Documentation

## 🚀 Free YouTube Song Download API

This API allows you to download YouTube songs and videos programmatically. Perfect for integrating YouTube downloads into your apps!

---

## 📍 Base URL
```
https://YOUR-REPL-URL
```

---

## 🎯 Endpoints

### 1. Download Song (Audio + Video)
Get download links for a YouTube video.

**Endpoint:** `GET /song?query={VIDEO_ID_OR_URL}`

**Parameters:**
- `query` (required): YouTube video ID or full URL

**Example Requests:**
```bash
# With video ID
GET /song?query=dQw4w9WgXcQ

# With full URL
GET /song?query=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "link": "https://YOUR-URL/audio/dQw4w9WgXcQ",
  "videoLink": "https://YOUR-URL/video/dQw4w9WgXcQ",
  "playLink": "https://YOUR-URL/play/dQw4w9WgXcQ"
}
```

---

### 2. Stream Audio Only
Download MP3 audio file.

**Endpoint:** `GET /audio/{VIDEO_ID}`

**Example:**
```bash
GET /audio/dQw4w9WgXcQ
```

**Response:** Direct MP3 file stream

---

### 3. Stream Video
Download MP4 video file.

**Endpoint:** `GET /video/{VIDEO_ID}`

**Example:**
```bash
GET /video/dQw4w9WgXcQ
```

**Response:** Direct MP4 file stream

---

### 4. Web Player
Play video in browser.

**Endpoint:** `GET /play/{VIDEO_ID}`

**Example:**
```bash
GET /play/dQw4w9WgXcQ
```

**Response:** HTML player page

---

## 💻 Integration Examples

### Python Example

```python
import requests

def download_youtube_song(video_url_or_id):
    """Download YouTube song using the API"""
    api_url = "https://YOUR-REPL-URL/song"
    
    response = requests.get(api_url, params={"query": video_url_or_id})
    data = response.json()
    
    if data.get("success"):
        print(f"Title: {data['title']}")
        print(f"Audio Link: {data['link']}")
        print(f"Video Link: {data['videoLink']}")
        
        # Download the audio file
        audio_response = requests.get(data['link'])
        with open(f"{data['videoId']}.mp3", 'wb') as f:
            f.write(audio_response.content)
        
        print(f"Downloaded: {data['title']}.mp3")
        return data
    else:
        print(f"Error: {data.get('error')}")
        return None

# Usage
download_youtube_song("dQw4w9WgXcQ")
# or
download_youtube_song("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
```

---

### JavaScript/Node.js Example

```javascript
const axios = require('axios');
const fs = require('fs');

async function downloadYoutubeSong(videoUrlOrId) {
    const apiUrl = 'https://YOUR-REPL-URL/song';
    
    try {
        const response = await axios.get(apiUrl, {
            params: { query: videoUrlOrId }
        });
        
        const data = response.data;
        
        if (data.success) {
            console.log(`Title: ${data.title}`);
            console.log(`Audio Link: ${data.link}`);
            console.log(`Video Link: ${data.videoLink}`);
            
            // Download the audio file
            const audioResponse = await axios.get(data.link, {
                responseType: 'stream'
            });
            
            const writer = fs.createWriteStream(`${data.videoId}.mp3`);
            audioResponse.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log(`Downloaded: ${data.title}.mp3`);
                    resolve(data);
                });
                writer.on('error', reject);
            });
        } else {
            console.error(`Error: ${data.error}`);
            return null;
        }
    } catch (error) {
        console.error('API Error:', error.message);
        return null;
    }
}

// Usage
downloadYoutubeSong('dQw4w9WgXcQ');
// or
downloadYoutubeSong('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
```

---

### PHP Example

```php
<?php

function downloadYoutubeSong($videoUrlOrId) {
    $apiUrl = 'https://YOUR-REPL-URL/song';
    
    $url = $apiUrl . '?' . http_build_query(['query' => $videoUrlOrId]);
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    if ($data['success']) {
        echo "Title: " . $data['title'] . "\n";
        echo "Audio Link: " . $data['link'] . "\n";
        echo "Video Link: " . $data['videoLink'] . "\n";
        
        // Download the audio file
        $audioContent = file_get_contents($data['link']);
        file_put_contents($data['videoId'] . '.mp3', $audioContent);
        
        echo "Downloaded: " . $data['title'] . ".mp3\n";
        return $data;
    } else {
        echo "Error: " . $data['error'] . "\n";
        return null;
    }
}

// Usage
downloadYoutubeSong('dQw4w9WgXcQ');
// or
downloadYoutubeSong('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
?>
```

---

### cURL Example

```bash
# Get song info
curl "https://YOUR-REPL-URL/song?query=dQw4w9WgXcQ"

# Download audio directly
curl -o song.mp3 "https://YOUR-REPL-URL/audio/dQw4w9WgXcQ"

# Download video directly
curl -o video.mp4 "https://YOUR-REPL-URL/video/dQw4w9WgXcQ"
```

---

## ⚡ Features

- ✅ **Free to use** - No API keys required
- ✅ **Fast downloads** - Cached for instant access
- ✅ **High quality** - Best available audio and video
- ✅ **Multiple formats** - MP3 audio and MP4 video
- ✅ **CORS enabled** - Works from browsers
- ✅ **Auto-processing** - Downloads happen automatically
- ✅ **Smart caching** - Videos cached after first request

---

## 🔒 Rate Limits

Currently, there are no strict rate limits, but please use responsibly:
- Don't spam the API with excessive requests
- Cache results on your end when possible
- Use for personal/educational projects

---

## ⚠️ Important Notes

1. **Video Size Limit**: Videos are limited to 480p to stay under 50MB (Telegram limitation)
2. **Processing Time**: First request may take 10-30 seconds while downloading
3. **Caching**: Subsequent requests for the same video are instant
4. **URL Format**: Both video IDs and full YouTube URLs are supported

---

## 📝 Error Responses

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

**Common Errors:**
- `Missing query parameter` - No video ID/URL provided
- `Failed to process song` - Download failed (invalid video, geo-restriction, etc.)
- `Video too large` - Video exceeds 50MB limit

---

## 🛠️ Support

For issues or questions, please open an issue on the GitHub repository.

---

## 📜 License

This API is provided as-is for educational and personal use. Please respect YouTube's Terms of Service.
