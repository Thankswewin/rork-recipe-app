#!/bin/bash

echo "🚀 Starting Rork App on RunPod"
echo "=============================="

# Step 1: Kill any existing processes
echo "🚫 Cleaning up existing processes..."
pkill -f node 2>/dev/null || true
pkill -f bun 2>/dev/null || true
pkill -f expo 2>/dev/null || true
pkill -f rork 2>/dev/null || true

# Kill processes on common ports
for port in 8081 3000 19000 19001 19002 8000 8080 4000; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

# Step 2: Check if Bun is available
if [ ! -f "$HOME/.bun/bin/bun" ]; then
    echo "❌ Bun not found. Please run setup-runpod-complete.sh first"
    exit 1
fi

# Step 3: Set PATH
export PATH="$HOME/.bun/bin:$PATH"

# Step 4: Navigate to correct directory
if [ -d "/workspace/rork-recipe-app" ]; then
    cd /workspace/rork-recipe-app
elif [ -d "/home/user/rork-app" ]; then
    cd /home/user/rork-app
else
    echo "❌ App directory not found"
    exit 1
fi

echo "📍 Working directory: $(pwd)"

# Step 5: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    $HOME/.bun/bin/bun install
fi

# Step 6: Add Expo CLI if missing
if ! $HOME/.bun/bin/bun list | grep -q "@expo/cli"; then
    echo "🔧 Adding Expo CLI..."
    $HOME/.bun/bin/bun add -D @expo/cli
fi

# Step 7: Start the app
echo "🚀 Starting the app..."
echo "📱 Your app will be available at the tunnel URL provided by Expo"
echo "🔗 Scan the QR code with Expo Go app on your phone"
echo ""

$HOME/.bun/bin/bun run start