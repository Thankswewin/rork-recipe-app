#!/bin/bash

echo "🚀 RunPod Fix and Start Script"
echo "================================"

# Kill any existing processes
echo "🔄 Killing existing processes..."
pkill -f "expo" || true
pkill -f "bun" || true
pkill -f "node" || true
pkill -f "rork" || true

# Wait a moment
sleep 2

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Navigating to workspace..."
    cd /workspace/rork-recipe-app || {
        echo "❌ Could not find rork-recipe-app directory"
        exit 1
    }
fi

echo "📍 Current directory: $(pwd)"

# Install bun if not available
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    source ~/.bashrc
fi

# Verify bun installation
echo "🔍 Bun version: $(bun --version)"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Check if rork CLI is available
if ! bun x rork --version &> /dev/null; then
    echo "📦 Installing rork CLI globally..."
    bun add -g rork
fi

# Set environment variables for RunPod
export EXPO_TUNNEL_SUBDOMAIN="rork-app-$(date +%s)"
export EXPO_USE_FAST_RESOLVER=1
export EXPO_NO_DOTENV=1

# Start the development server with tunnel
echo "🚀 Starting Expo development server with tunnel..."
echo "📱 This will generate a QR code for your iOS device"

# Use the exact command from package.json
bun run start

# If that fails, try alternative approach
if [ $? -ne 0 ]; then
    echo "⚠️  Primary start command failed, trying alternative..."
    bunx expo start --tunnel --port 8081
fi