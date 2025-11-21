#!/bin/bash
set -e

echo "📦 Installing system dependencies..."

# Install ffmpeg (required for audio/video processing)
apt-get update
apt-get install -y ffmpeg

# Verify installation
echo "✅ ffmpeg version:"
ffmpeg -version | head -n 1

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "✅ Build complete!"
echo "🎉 Using play-dl + ffmpeg for YouTube downloads with advanced bot bypass!"
