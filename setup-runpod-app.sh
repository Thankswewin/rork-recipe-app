#!/bin/bash

echo "🚀 Setting up React Native App on RunPod..."

# Update system
echo "📦 Updating system packages..."
apt update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install Bun if not present
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
else
    echo "✅ Bun already installed: $(bun --version)"
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    apt install -y git
else
    echo "✅ Git already installed: $(git --version)"
fi

# Install dependencies
echo "📦 Installing app dependencies..."
bun install

# Setup environment file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please edit .env file with your actual credentials"
    else
        echo "⚠️  No .env.example found. Please create .env manually"
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete! To start your app:"
echo "   bun run start        # For mobile (with QR code)"
echo "   bun run start-web    # For web version"
echo ""
echo "📱 Your app will be accessible via:"
echo "   - Mobile: Scan QR code with Expo Go"
echo "   - Web: Tunnel URL shown in terminal"
echo ""
echo "🔧 If you need to edit environment variables:"
echo "   nano .env"