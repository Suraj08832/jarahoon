const axios = require('axios');

class YouTubeExtractor {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/,
      /youtube\.com\/embed\/([^&?#]+)/,
      /youtube\.com\/v\/([^&?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async extractYouTubeStreamingData(videoId) {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      const response = await axios.get(videoUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });

      if (response.status === 200) {
        const html = response.data;
        
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'YouTube Video';
        
        const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});\s*var/);
        if (playerResponseMatch) {
          const playerData = JSON.parse(playerResponseMatch[1]);
          return this.processYouTubePlayerData(playerData, videoId, title);
        }

        const altMatch = html.match(/var ytInitialPlayerResponse = ({.+?});<\/script>/);
        if (altMatch) {
          const playerData = JSON.parse(altMatch[1]);
          return this.processYouTubePlayerData(playerData, videoId, title);
        }

        const windowMatch = html.match(/window\["ytInitialPlayerResponse"\] = ({.+?});<\/script>/);
        if (windowMatch) {
          const playerData = JSON.parse(windowMatch[1]);
          return this.processYouTubePlayerData(playerData, videoId, title);
        }
      }
    } catch (err) {
      console.log('YouTube streaming extraction failed:', err.message);
    }
    return null;
  }

  processYouTubePlayerData(playerData, videoId, title) {
    const formats = [];
    
    if (playerData.streamingData && playerData.streamingData.formats) {
      playerData.streamingData.formats.forEach(format => {
        if (format.url || format.signatureCipher) {
          const quality = format.qualityLabel || `${format.height}p` || 'unknown';
          let url = format.url;
          
          if (format.signatureCipher) {
            const cipherParams = new URLSearchParams(format.signatureCipher);
            url = cipherParams.get('url');
          }
          
          if (url) {
            formats.push({
              quality: quality,
              url: url,
              type: format.mimeType || 'video/mp4',
              width: format.width || null,
              height: format.height || null,
              fps: format.fps || null,
              hasAudio: true,
              hasVideo: true
            });
          }
        }
      });
    }

    if (playerData.streamingData && playerData.streamingData.adaptiveFormats) {
      playerData.streamingData.adaptiveFormats.forEach(format => {
        if (format.url || format.signatureCipher) {
          const quality = format.qualityLabel || 
                         (format.audioQuality ? 'audio' : 'unknown') ||
                         `${format.height}p` || 'unknown';
          
          let url = format.url;
          
          if (format.signatureCipher) {
            const cipherParams = new URLSearchParams(format.signatureCipher);
            url = cipherParams.get('url');
          }
          
          if (url) {
            const isAudio = format.mimeType && format.mimeType.includes('audio');
            
            formats.push({
              quality: quality,
              url: url,
              type: format.mimeType || (isAudio ? 'audio/mp4' : 'video/mp4'),
              width: format.width || null,
              height: format.height || null,
              fps: format.fps || null,
              hasAudio: isAudio,
              hasVideo: !isAudio,
              audioQuality: format.audioQuality || null,
              bitrate: format.bitrate || null
            });
          }
        }
      });
    }

    if (formats.length > 0) {
      const videoDetails = playerData.videoDetails || {};
      
      return {
        status: 'success',
        videoId: videoId,
        title: videoDetails.title || title,
        duration: this.formatDuration(videoDetails.lengthSeconds),
        durationSeconds: parseInt(videoDetails.lengthSeconds) || 0,
        author: videoDetails.author || '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        formats: formats,
        source: 'youtube-direct'
      };
    }

    return null;
  }

  async getYouTubePlayerData(videoId) {
    try {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      const response = await axios.get(embedUrl, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (response.status === 200) {
        const html = response.data;
        
        const configMatch = html.match(/yt\.setConfig\(({.+?})\);/);
        if (configMatch) {
          const config = JSON.parse(configMatch[1]);
          if (config.VIDEO_INFO) {
            const videoInfo = new URLSearchParams(config.VIDEO_INFO);
            const title = videoInfo.get('title') || 'YouTube Video';
            
            return {
              status: 'success',
              videoId: videoId,
              title: title,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              source: 'youtube-embed',
              formats: []
            };
          }
        }
      }
    } catch (err) {
      console.log('YouTube player API failed:', err.message);
    }
    return null;
  }

  async getYouTubeEmbedData(videoId) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      const response = await axios.get(oembedUrl, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (response.status === 200) {
        const data = response.data;
        
        return {
          status: 'success',
          videoId: videoId,
          title: data.title || 'YouTube Video',
          author: data.author_name || '',
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          source: 'youtube-oembed',
          formats: []
        };
      }
    } catch (err) {
      console.log('YouTube oembed failed:', err.message);
    }
    return null;
  }

  async tryInvidious(videoId) {
    try {
      const instances = [
        'https://invidious.snopyta.org',
        'https://yewtu.be',
        'https://invidiou.site'
      ];

      for (const instance of instances) {
        try {
          const apiUrl = `${instance}/api/v1/videos/${videoId}`;
          const response = await axios.get(apiUrl, {
            headers: {
              'User-Agent': this.userAgent
            },
            timeout: 10000
          });

          if (response.status === 200) {
            const data = response.data;
            
            const formats = [];
            if (data.formatStreams) {
              data.formatStreams.forEach(stream => {
                if (stream.url) {
                  formats.push({
                    quality: stream.quality || 'unknown',
                    url: stream.url,
                    type: stream.type || 'video/mp4',
                    container: stream.container || 'mp4',
                    hasAudio: true,
                    hasVideo: true
                  });
                }
              });
            }

            if (data.adaptiveFormats) {
              data.adaptiveFormats.forEach(stream => {
                if (stream.url) {
                  const isAudio = stream.type && stream.type.includes('audio');
                  formats.push({
                    quality: stream.qualityLabel || (isAudio ? 'audio' : 'unknown'),
                    url: stream.url,
                    type: stream.type || 'video/mp4',
                    hasAudio: isAudio,
                    hasVideo: !isAudio,
                    bitrate: stream.bitrate || null
                  });
                }
              });
            }

            return {
              status: 'success',
              videoId: videoId,
              title: data.title || 'YouTube Video',
              duration: data.lengthSeconds ? this.formatDuration(data.lengthSeconds) : '',
              durationSeconds: data.lengthSeconds || 0,
              author: data.author || '',
              thumbnail: data.videoThumbnails ? data.videoThumbnails[0]?.url : `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              formats: formats,
              source: 'invidious'
            };
          }
        } catch (err) {
          continue;
        }
      }
    } catch (err) {
      console.log('Invidious failed:', err.message);
    }
    return null;
  }

  async extractVideoData(videoId) {
    try {
      console.log(`🔍 Extracting data for video: ${videoId}`);

      const result1 = await this.extractYouTubeStreamingData(videoId);
      if (result1 && result1.formats && result1.formats.length > 0) {
        console.log(`✅ Method 1 (Direct YouTube) successful - Found ${result1.formats.length} formats`);
        return result1;
      }

      const result2 = await this.getYouTubePlayerData(videoId);
      if (result2 && result2.formats && result2.formats.length > 0) {
        console.log(`✅ Method 2 (YouTube Player) successful`);
        return result2;
      }

      const result3 = await this.getYouTubeEmbedData(videoId);
      if (result3) {
        console.log(`✅ Method 3 (YouTube Embed) successful`);
        return result3;
      }

      const result4 = await this.tryInvidious(videoId);
      if (result4 && result4.formats && result4.formats.length > 0) {
        console.log(`✅ Method 4 (Invidious) successful - Found ${result4.formats.length} formats`);
        return result4;
      }

      throw new Error('All extraction methods failed');

    } catch (err) {
      console.log('❌ All extraction methods failed:', err.message);
      throw err;
    }
  }

  getBestAudioFormat(formats) {
    const audioFormats = formats.filter(f => f.hasAudio && !f.hasVideo);
    
    if (audioFormats.length === 0) {
      const combinedFormats = formats.filter(f => f.hasAudio && f.hasVideo);
      return combinedFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    }
    
    return audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
  }

  getBestVideoFormat(formats) {
    const videoFormats = formats.filter(f => f.hasVideo);
    
    const format720p = videoFormats.find(f => f.quality === '720p' && f.hasAudio);
    if (format720p) return format720p;
    
    const format360p = videoFormats.find(f => f.quality === '360p' && f.hasAudio);
    if (format360p) return format360p;
    
    const formatWithAudio = videoFormats.find(f => f.hasAudio);
    if (formatWithAudio) return formatWithAudio;
    
    return videoFormats.sort((a, b) => {
      const heightA = a.height || 0;
      const heightB = b.height || 0;
      return Math.abs(heightA - 720) - Math.abs(heightB - 720);
    })[0];
  }
}

module.exports = new YouTubeExtractor();
