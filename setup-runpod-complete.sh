#!/bin/bash

echo "🚀 Complete RunPod Setup for Rork App"
echo "======================================"

# Step 1: Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update && apt-get install -y unzip curl lsof psmisc

# Step 2: Kill any existing processes
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

# Step 3: Install Bun
echo "🔧 Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Step 4: Setup PATH
echo "🛠️ Setting up PATH..."
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Step 5: Verify Bun installation
echo "✅ Verifying Bun installation..."
if [ -f "$HOME/.bun/bin/bun" ]; then
    echo "Bun installed successfully at: $HOME/.bun/bin/bun"
    $HOME/.bun/bin/bun --version
else
    echo "❌ Bun installation failed"
    exit 1
fi

# Step 6: Install dependencies
echo "📦 Installing project dependencies..."
cd /workspace/rork-recipe-app 2>/dev/null || cd /home/user/rork-app
$HOME/.bun/bin/bun install

# Step 7: Add Expo CLI if missing
echo "🔧 Adding Expo CLI..."
$HOME/.bun/bin/bun add -D @expo/cli

# Verify installations
echo ""
echo "✅ Setup Complete!"
echo ""
echo "🔧 Verification:"
echo "   Node.js: $(node --version 2>/dev/null || echo 'FAILED')"
echo "   npm: $(npm --version 2>/dev/null || echo 'FAILED')"
echo "   Bun: $(~/.bun/bin/bun --version 2>/dev/null || echo 'FAILED')"
echo "   Expo CLI: $(npx expo --version 2>/dev/null || echo 'FAILED')"
echo "   Git: $(git --version 2>/dev/null || echo 'FAILED')"
echo ""
echo "🎯 To start your app:"
echo "   ~/.bun/bin/bun run start        # Start with tunnel"
echo "   ~/.bun/bin/bun run start-web    # Start web version"
echo "   npx expo start --tunnel         # Alternative with Expo CLI"
echo ""
echo "📱 Scan the QR code with Expo Go app on your phone"
echo "🌐 Or access the web version at the provided URL"