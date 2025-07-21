#!/bin/bash

echo "🚀 Starting Rork Recipe App on RunPod"
echo "====================================="

# Add Bun to PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "🌐 Public IP: $PUBLIC_IP"

# Check if Bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found. Running setup..."
    chmod +x setup-runpod-complete.sh && ./setup-runpod-complete.sh
    export PATH="$HOME/.bun/bin:$PATH"
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Bun still not available. Please run: source ~/.bashrc"
    echo "Then try again or run: ~/.bun/bin/bun run start"
    exit 1
fi

echo "✅ Bun found: $(bun --version)"

# Kill any existing processes first
echo "🧹 Cleaning up existing processes..."
pkill -f node 2>/dev/null || true
pkill -f bun 2>/dev/null || true
pkill -f expo 2>/dev/null || true

# Check for processes on RunPod ports
for port in 8000 8001 3000 8081 19000 19001 19002; do
    if lsof -i:$port 2>/dev/null; then
        echo "🛑 Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

# Update environment with public IP
echo "EXPO_PUBLIC_API_URL=http://$PUBLIC_IP:8000" > .env

echo ""
echo "📦 Installing/updating dependencies..."
bun install

echo ""
echo "🎯 Starting the application..."
echo "📱 App will be available at: http://$PUBLIC_IP:8000"
echo "🔗 Backend API at: http://$PUBLIC_IP:8000/api"
echo "📱 Scan the QR code with your phone's camera or Expo Go app"
echo ""

# Start with specific host and port for RunPod
EXPO_PUBLIC_API_URL=http://$PUBLIC_IP:8000 bun run start -- --host 0.0.0.0 --port 8000