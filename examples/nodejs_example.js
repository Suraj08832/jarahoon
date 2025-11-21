/**
 * YouTube Music Bot API - Node.js Integration Example
 * Replace YOUR_API_URL with your actual API URL
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://YOUR-REPL-URL'; // Replace with your actual URL

/**
 * Get song information and download links
 * @param {string} videoUrlOrId - YouTube video ID or full URL
 * @returns {Promise<Object|null>} Song information
 */
async function getSongInfo(videoUrlOrId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/song`, {
            params: { query: videoUrlOrId },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

/**
 * Download MP3 audio file
 * @param {string} videoUrlOrId - YouTube video ID or full URL
 * @param {string} outputFilename - Optional custom filename
 * @returns {Promise<string|null>} Path to downloaded file
 */
async function downloadAudio(videoUrlOrId, outputFilename = null) {
    try {
        // First get song info
        const songInfo = await getSongInfo(videoUrlOrId);
        
        if (!songInfo || !songInfo.success) {
            console.error(`Failed to get song info: ${songInfo?.error || 'Unknown error'}`);
            return null;
        }
        
        // Set filename
        if (!outputFilename) {
            outputFilename = `${songInfo.videoId}.mp3`;
        }
        
        console.log(`Downloading: ${songInfo.title}`);
        console.log(`Audio Link: ${songInfo.link}`);
        
        // Download the audio file
        const response = await axios.get(songInfo.link, {
            responseType: 'stream',
            timeout: 60000
        });
        
        const writer = fs.createWriteStream(outputFilename);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded successfully: ${outputFilename}`);
                resolve(outputFilename);
            });
            writer.on('error', (error) => {
                console.error(`Download failed: ${error.message}`);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('Download failed:', error.message);
        return null;
    }
}

/**
 * Download MP4 video file
 * @param {string} videoUrlOrId - YouTube video ID or full URL
 * @param {string} outputFilename - Optional custom filename
 * @returns {Promise<string|null>} Path to downloaded file
 */
async function downloadVideo(videoUrlOrId, outputFilename = null) {
    try {
        // First get song info
        const songInfo = await getSongInfo(videoUrlOrId);
        
        if (!songInfo || !songInfo.success) {
            console.error(`Failed to get song info: ${songInfo?.error || 'Unknown error'}`);
            return null;
        }
        
        // Set filename
        if (!outputFilename) {
            outputFilename = `${songInfo.videoId}.mp4`;
        }
        
        console.log(`Downloading video: ${songInfo.title}`);
        console.log(`Video Link: ${songInfo.videoLink}`);
        
        // Download the video file
        const response = await axios.get(songInfo.videoLink, {
            responseType: 'stream',
            timeout: 120000
        });
        
        const writer = fs.createWriteStream(outputFilename);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded successfully: ${outputFilename}`);
                resolve(outputFilename);
            });
            writer.on('error', (error) => {
                console.error(`Download failed: ${error.message}`);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('Download failed:', error.message);
        return null;
    }
}

/**
 * Main function - Example usage
 */
async function main() {
    console.log('='.repeat(50));
    console.log('Example 1: Get Song Info');
    console.log('='.repeat(50));
    
    const songInfo = await getSongInfo('dQw4w9WgXcQ');
    if (songInfo) {
        console.log(`Success: ${songInfo.success}`);
        console.log(`Title: ${songInfo.title}`);
        console.log(`Video ID: ${songInfo.videoId}`);
        console.log(`Audio Link: ${songInfo.link}`);
        console.log(`Video Link: ${songInfo.videoLink}`);
        console.log();
    }
    
    console.log('='.repeat(50));
    console.log('Example 2: Download Audio');
    console.log('='.repeat(50));
    
    const audioFile = await downloadAudio('dQw4w9WgXcQ', 'my_song.mp3');
    if (audioFile) {
        console.log(`Audio saved to: ${audioFile}`);
        console.log();
    }
    
    console.log('='.repeat(50));
    console.log('Example 3: Download from Full URL');
    console.log('='.repeat(50));
    
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const audioFile2 = await downloadAudio(youtubeUrl);
    if (audioFile2) {
        console.log(`Downloaded from URL: ${audioFile2}`);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

// Export functions for use in other modules
module.exports = {
    getSongInfo,
    downloadAudio,
    downloadVideo
};
