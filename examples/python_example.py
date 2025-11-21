#!/usr/bin/env python3
"""
YouTube Music Bot API - Python Integration Example
Replace YOUR_API_URL with your actual API URL
"""

import requests
import os

# Configuration
API_BASE_URL = "https://YOUR-REPL-URL"  # Replace with your actual URL

def get_song_info(video_url_or_id):
    """
    Get song information and download links
    
    Args:
        video_url_or_id: YouTube video ID or full URL
        
    Returns:
        dict: Song information with download links
    """
    try:
        response = requests.get(
            f"{API_BASE_URL}/song",
            params={"query": video_url_or_id},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

def download_audio(video_url_or_id, output_filename=None):
    """
    Download MP3 audio file
    
    Args:
        video_url_or_id: YouTube video ID or full URL
        output_filename: Optional custom filename (default: {videoId}.mp3)
        
    Returns:
        str: Path to downloaded file or None if failed
    """
    # First get song info
    song_info = get_song_info(video_url_or_id)
    
    if not song_info or not song_info.get('success'):
        print(f"Failed to get song info: {song_info.get('error', 'Unknown error')}")
        return None
    
    # Set filename
    if not output_filename:
        output_filename = f"{song_info['videoId']}.mp3"
    
    print(f"Downloading: {song_info['title']}")
    print(f"Audio Link: {song_info['link']}")
    
    try:
        # Download the audio file
        response = requests.get(song_info['link'], stream=True, timeout=60)
        response.raise_for_status()
        
        with open(output_filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        print(f"✅ Downloaded successfully: {output_filename}")
        return output_filename
        
    except requests.exceptions.RequestException as e:
        print(f"Download failed: {e}")
        return None

def download_video(video_url_or_id, output_filename=None):
    """
    Download MP4 video file
    
    Args:
        video_url_or_id: YouTube video ID or full URL
        output_filename: Optional custom filename (default: {videoId}.mp4)
        
    Returns:
        str: Path to downloaded file or None if failed
    """
    # First get song info
    song_info = get_song_info(video_url_or_id)
    
    if not song_info or not song_info.get('success'):
        print(f"Failed to get song info: {song_info.get('error', 'Unknown error')}")
        return None
    
    # Set filename
    if not output_filename:
        output_filename = f"{song_info['videoId']}.mp4"
    
    print(f"Downloading video: {song_info['title']}")
    print(f"Video Link: {song_info['videoLink']}")
    
    try:
        # Download the video file
        response = requests.get(song_info['videoLink'], stream=True, timeout=120)
        response.raise_for_status()
        
        with open(output_filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        print(f"✅ Downloaded successfully: {output_filename}")
        return output_filename
        
    except requests.exceptions.RequestException as e:
        print(f"Download failed: {e}")
        return None

def main():
    """Example usage"""
    
    # Example 1: Get song info
    print("=" * 50)
    print("Example 1: Get Song Info")
    print("=" * 50)
    
    song_info = get_song_info("dQw4w9WgXcQ")
    if song_info:
        print(f"Success: {song_info['success']}")
        print(f"Title: {song_info['title']}")
        print(f"Video ID: {song_info['videoId']}")
        print(f"Audio Link: {song_info['link']}")
        print(f"Video Link: {song_info['videoLink']}")
        print()
    
    # Example 2: Download audio
    print("=" * 50)
    print("Example 2: Download Audio")
    print("=" * 50)
    
    audio_file = download_audio("dQw4w9WgXcQ", "my_song.mp3")
    if audio_file:
        print(f"Audio saved to: {audio_file}")
        print()
    
    # Example 3: Download from full URL
    print("=" * 50)
    print("Example 3: Download from Full URL")
    print("=" * 50)
    
    youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    audio_file = download_audio(youtube_url)
    if audio_file:
        print(f"Downloaded from URL: {audio_file}")

if __name__ == "__main__":
    main()
