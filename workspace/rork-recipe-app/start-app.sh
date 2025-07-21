#!/bin/bash

echo "🚀 Starting Rork Recipe App..."

# Add Bun to PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Check if Bun is available
if ! command -v bun &> /dev/null; then
    echo "❌ Bun not found. Running quick fix..."
    chmod +x quick-fix.sh && ./quick-fix.sh
    export PATH="$HOME/.bun/bin:$PATH"
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Bun still not available. Please run: source ~/.bashrc"
    echo "Then try again or run: ~/.bun/bin/bun run start"
    exit 1
fi

echo "✅ Bun found: $(bun --version)"

# Check if we have package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Copying project files..."
    if [ -d "/home/user/rork-app" ]; then
        cp -r /home/user/rork-app/* .
        echo "✅ Project files copied!"
    else
        echo "❌ Project files not found. Please check your project location."
        exit 1
    fi
fi

# Kill any existing processes first
echo "🧹 Cleaning up existing processes..."
pkill -f node 2>/dev/null || true
pkill -f bun 2>/dev/null || true
pkill -f expo 2>/dev/null || true

# Check for processes on common ports
for port in 3000 8081 19000 19001 19002; do
    if lsof -i:$port 2>/dev/null; then
        echo "🛑 Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo ""
echo "📦 Installing/updating dependencies..."
bun install

echo ""
echo "🎯 Starting the application..."
echo "📱 Your app will be available via tunnel URL"
echo "🌐 You can scan the QR code with your phone"
echo ""
bun run start