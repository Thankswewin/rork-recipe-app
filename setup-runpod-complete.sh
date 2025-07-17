#!/bin/bash

echo "🚀 Complete RunPod Setup for React Native App..."

# Update system
echo "📦 Updating system packages..."
apt update -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "📥 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Bun
echo "📥 Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Install additional dependencies
echo "📦 Installing additional dependencies..."
apt-get install -y \
    curl \
    wget \
    unzip \
    build-essential \
    python3 \
    python3-pip

# Install Expo CLI globally
echo "📱 Installing Expo CLI..."
npm install -g @expo/cli

# Install app dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing app dependencies..."
    ~/.bun/bin/bun install
fi

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