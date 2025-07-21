#!/bin/bash

echo "🚀 RunPod Complete Setup Script"
echo "================================"

# Update system and install essential packages
echo "📦 Installing system dependencies..."
apt-get update -y
apt-get install -y curl unzip openssh-server nano git

# Install Bun
echo "🍞 Installing Bun..."
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
export PATH="$HOME/.bun/bin:$PATH"

# Verify Bun installation
echo "✅ Verifying Bun installation..."
if command -v bun &> /dev/null; then
    echo "Bun version: $(bun --version)"
else
    echo "❌ Bun installation failed"
    exit 1
fi

# Set up SSH
echo "🔐 Setting up SSH..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

# Configure SSH daemon
echo "Port 22" > /etc/ssh/sshd_config
echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config
echo "AuthorizedKeysFile .ssh/authorized_keys" >> /etc/ssh/sshd_config

# Set root password (you can change this)
echo "root:runpod123" | chpasswd

# Start SSH service
service ssh start
service ssh enable

# Navigate to app directory
cd /workspace/rork-recipe-app

# Install dependencies
echo "📱 Installing app dependencies..."
bun install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "EXPO_PUBLIC_API_URL=http://localhost:8000" > .env
fi

# Kill any existing processes on ports 8000 and 8001
echo "🔄 Cleaning up existing processes..."
pkill -f "expo" || true
pkill -f "bun" || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true

# Get the public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "🌐 Your RunPod public IP: $PUBLIC_IP"

# Update the environment with the correct URL
echo "EXPO_PUBLIC_API_URL=http://$PUBLIC_IP:8000" > .env

echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: bun start"
echo "2. The app will be available at: http://$PUBLIC_IP:8000"
echo "3. For SSH access use: ssh root@$PUBLIC_IP -p 22"
echo "4. SSH password: runpod123"
echo ""
echo "📱 For mobile access:"
echo "- Make sure your RunPod has HTTP ports 8000,8001 exposed"
echo "- The QR code should work with the public IP"
echo ""