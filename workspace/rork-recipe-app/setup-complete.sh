#!/bin/bash

echo "🚀 Setting up complete environment for Rork Recipe App..."

# Update package list
echo "📦 Updating package list..."
apt-get update

# Install required system packages
echo "🔧 Installing system dependencies..."
apt-get install -y curl unzip wget git lsof

# Install Node.js (LTS version)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Install Bun
echo "🚀 Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Add Bun to PATH permanently
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

echo "✅ Installation complete!"
echo ""
echo "📋 Installed versions:"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not available')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not available')"
echo "Bun: $(~/.bun/bin/bun --version 2>/dev/null || echo 'Installation may need restart')"
echo ""

# Copy project files from the correct location if they exist
if [ -d "/home/user/rork-app" ]; then
    echo "📁 Copying project files from /home/user/rork-app..."
    cp -r /home/user/rork-app/* /workspace/rork-recipe-app/ 2>/dev/null || echo "Some files may not have been copied"
fi

echo "🔄 Installing project dependencies..."
cd /workspace/rork-recipe-app

# Try to install dependencies
if [ -f "package.json" ]; then
    ~/.bun/bin/bun install
else
    echo "⚠️  No package.json found. You may need to copy your project files."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 To start your app:"
echo "1. Run: chmod +x start-app.sh && ./start-app.sh"
echo "2. Or manually: export PATH=\"\$HOME/.bun/bin:\$PATH\" && bun run start"
echo ""
echo "🧹 To kill existing processes: chmod +x kill-all-processes.sh && ./kill-all-processes.sh"