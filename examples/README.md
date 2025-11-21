# 🎵 API Integration Examples

Example code for integrating YouTube Music Bot API into your applications.

## 📁 Files

- **`python_example.py`** - Python integration with requests library
- **`nodejs_example.js`** - Node.js integration with axios
- **`php_example.php`** - PHP integration with built-in functions

## 🚀 Quick Start

### Python
```bash
# Install dependencies
pip install requests

# Edit python_example.py and replace YOUR_API_URL
python python_example.py
```

### Node.js
```bash
# Install dependencies
npm install axios

# Edit nodejs_example.js and replace YOUR_API_URL
node nodejs_example.js
```

### PHP
```bash
# Edit php_example.php and replace YOUR_API_URL
php php_example.php
```

## 📝 Usage

All examples provide three main functions:

1. **`getSongInfo(videoUrlOrId)`** - Get song details and download links
2. **`downloadAudio(videoUrlOrId, outputFilename)`** - Download MP3 audio
3. **`downloadVideo(videoUrlOrId, outputFilename)`** - Download MP4 video

## 🔗 API Endpoint

The main endpoint is:
```
GET /song?query={VIDEO_ID_OR_URL}
```

Response:
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "title": "Song Title",
  "link": "https://YOUR-URL/audio/dQw4w9WgXcQ",
  "videoLink": "https://YOUR-URL/video/dQw4w9WgXcQ",
  "playLink": "https://YOUR-URL/play/dQw4w9WgXcQ"
}
```

## ⚡ Features

- ✅ Works with video IDs or full YouTube URLs
- ✅ Auto-caching for faster subsequent requests
- ✅ Direct streaming links
- ✅ No API keys required
- ✅ CORS enabled for browser usage

## 📚 Full Documentation

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete API reference.
