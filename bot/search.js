const axios = require('axios');

class YouTubeSearch {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.apiUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async searchByName(query) {
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured');
    }

    try {
      const response = await axios.get(`${this.apiUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 5,
          key: this.apiKey,
          videoCategoryId: '10'
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      const videoIds = response.data.items.map(item => item.id.videoId).join(',');
      
      const detailsResponse = await axios.get(`${this.apiUrl}/videos`, {
        params: {
          part: 'contentDetails,snippet',
          id: videoIds,
          key: this.apiKey
        }
      });

      const videos = detailsResponse.data.items.map(video => ({
        id: video.id,
        title: video.snippet.title,
        duration: this.formatDuration(video.contentDetails.duration),
        author: video.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${video.id}`
      }));

      return videos;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        throw new Error('YouTube API quota exceeded or invalid API key');
      }
      throw new Error(`YouTube search failed: ${error.message}`);
    }
  }

  formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async getFirstResult(query) {
    const results = await this.searchByName(query);
    
    if (results.length === 0) {
      throw new Error(`No results found for: ${query}`);
    }
    
    return results[0];
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
      return url;
    }
    
    return null;
  }
}

module.exports = new YouTubeSearch();
