<?php
/**
 * YouTube Music Bot API - PHP Integration Example
 * Replace YOUR_API_URL with your actual API URL
 */

// Configuration
define('API_BASE_URL', 'https://YOUR-REPL-URL'); // Replace with your actual URL

/**
 * Get song information and download links
 * 
 * @param string $videoUrlOrId YouTube video ID or full URL
 * @return array|null Song information
 */
function getSongInfo($videoUrlOrId) {
    $url = API_BASE_URL . '/song?' . http_build_query(['query' => $videoUrlOrId]);
    
    $options = [
        'http' => [
            'method' => 'GET',
            'timeout' => 30,
            'header' => 'User-Agent: PHP-YouTube-Downloader/1.0'
        ]
    ];
    
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "Error: Failed to connect to API\n";
        return null;
    }
    
    return json_decode($response, true);
}

/**
 * Download MP3 audio file
 * 
 * @param string $videoUrlOrId YouTube video ID or full URL
 * @param string|null $outputFilename Optional custom filename
 * @return string|null Path to downloaded file
 */
function downloadAudio($videoUrlOrId, $outputFilename = null) {
    // First get song info
    $songInfo = getSongInfo($videoUrlOrId);
    
    if (!$songInfo || !$songInfo['success']) {
        $error = $songInfo['error'] ?? 'Unknown error';
        echo "Failed to get song info: $error\n";
        return null;
    }
    
    // Set filename
    if ($outputFilename === null) {
        $outputFilename = $songInfo['videoId'] . '.mp3';
    }
    
    echo "Downloading: {$songInfo['title']}\n";
    echo "Audio Link: {$songInfo['link']}\n";
    
    // Download the audio file
    $audioContent = @file_get_contents($songInfo['link']);
    
    if ($audioContent === false) {
        echo "Download failed\n";
        return null;
    }
    
    if (file_put_contents($outputFilename, $audioContent) === false) {
        echo "Failed to save file\n";
        return null;
    }
    
    echo "✅ Downloaded successfully: $outputFilename\n";
    return $outputFilename;
}

/**
 * Download MP4 video file
 * 
 * @param string $videoUrlOrId YouTube video ID or full URL
 * @param string|null $outputFilename Optional custom filename
 * @return string|null Path to downloaded file
 */
function downloadVideo($videoUrlOrId, $outputFilename = null) {
    // First get song info
    $songInfo = getSongInfo($videoUrlOrId);
    
    if (!$songInfo || !$songInfo['success']) {
        $error = $songInfo['error'] ?? 'Unknown error';
        echo "Failed to get song info: $error\n";
        return null;
    }
    
    // Set filename
    if ($outputFilename === null) {
        $outputFilename = $songInfo['videoId'] . '.mp4';
    }
    
    echo "Downloading video: {$songInfo['title']}\n";
    echo "Video Link: {$songInfo['videoLink']}\n";
    
    // Download the video file
    $videoContent = @file_get_contents($songInfo['videoLink']);
    
    if ($videoContent === false) {
        echo "Download failed\n";
        return null;
    }
    
    if (file_put_contents($outputFilename, $videoContent) === false) {
        echo "Failed to save file\n";
        return null;
    }
    
    echo "✅ Downloaded successfully: $outputFilename\n";
    return $outputFilename;
}

// Example usage
function main() {
    echo str_repeat('=', 50) . "\n";
    echo "Example 1: Get Song Info\n";
    echo str_repeat('=', 50) . "\n";
    
    $songInfo = getSongInfo('dQw4w9WgXcQ');
    if ($songInfo) {
        echo "Success: " . ($songInfo['success'] ? 'true' : 'false') . "\n";
        echo "Title: {$songInfo['title']}\n";
        echo "Video ID: {$songInfo['videoId']}\n";
        echo "Audio Link: {$songInfo['link']}\n";
        echo "Video Link: {$songInfo['videoLink']}\n";
        echo "\n";
    }
    
    echo str_repeat('=', 50) . "\n";
    echo "Example 2: Download Audio\n";
    echo str_repeat('=', 50) . "\n";
    
    $audioFile = downloadAudio('dQw4w9WgXcQ', 'my_song.mp3');
    if ($audioFile) {
        echo "Audio saved to: $audioFile\n";
        echo "\n";
    }
    
    echo str_repeat('=', 50) . "\n";
    echo "Example 3: Download from Full URL\n";
    echo str_repeat('=', 50) . "\n";
    
    $youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    $audioFile2 = downloadAudio($youtubeUrl);
    if ($audioFile2) {
        echo "Downloaded from URL: $audioFile2\n";
    }
}

// Run examples if this file is executed directly
if (php_sapi_name() === 'cli') {
    main();
}
