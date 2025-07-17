#!/bin/bash

echo "🚀 Setting up RunPod for React Native App..."

# Fix Docker if needed
echo "📦 Fixing Docker permissions..."
pkill dockerd 2>/dev/null || true
pkill containerd 2>/dev/null || true

# Start Docker with RunPod-compatible settings
dockerd --storage-driver=vfs --iptables=false --ip6tables=false --bridge=none &
sleep 5

# Install Bun if not available
if ! command -v bun &> /dev/null; then
    echo "📥 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# Install dependencies
echo "📦 Installing app dependencies..."
bun install

echo "✅ Setup complete!"
echo ""
echo "🎯 To start your app:"
echo "   bun run start        # Start with tunnel (recommended)"
echo "   bun run start-web    # Start web version"
echo ""
echo "📱 Scan the QR code with Expo Go app on your phone"
echo "🌐 Or access the web version at the provided URL"