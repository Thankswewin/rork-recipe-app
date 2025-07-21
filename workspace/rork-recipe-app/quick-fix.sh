#!/bin/bash

echo "🔧 Quick Fix for Bun and Project Setup"

# Install unzip first (required for Bun)
echo "📦 Installing unzip..."
apt-get update && apt-get install -y unzip lsof

# Install Bun properly
echo "🚀 Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Add to PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Add to bashrc permanently
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

echo "✅ Bun installed!"

# Check if we have project files
if [ ! -f "/workspace/rork-recipe-app/package.json" ]; then
    echo "📁 Copying project files..."
    if [ -d "/home/user/rork-app" ]; then
        cp -r /home/user/rork-app/* /workspace/rork-recipe-app/
        echo "✅ Project files copied!"
    else
        echo "⚠️  Project files not found at /home/user/rork-app"
    fi
fi

# Kill any existing processes
echo "🧹 Cleaning up processes..."
pkill -f node 2>/dev/null || true
pkill -f bun 2>/dev/null || true
pkill -f expo 2>/dev/null || true

# Install dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    ~/.bun/bin/bun install
fi

echo ""
echo "🎉 Quick fix complete!"
echo ""
echo "🚀 To start your app, run:"
echo "  export PATH=\"\$HOME/.bun/bin:\$PATH\""
echo "  bun run start"
echo ""
echo "Or simply run: ./start-app.sh"