#!/bin/bash

# RORK Recipe App - RunPod Setup Script
# This script sets up the complete environment for running the app on RunPod

echo "🚀 Setting up RORK Recipe App on RunPod..."

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
apt install -y curl wget unzip git build-essential

# Install Node.js (using NodeSource repository for latest LTS)
echo "📱 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install Bun (alternative package manager)
echo "🥖 Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Add Bun to bashrc for future sessions
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Install project dependencies
echo "📚 Installing project dependencies..."
npm install

# Alternative: Use Bun if preferred
# bun install

# Create .env file from example
echo "⚙️ Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from .env.example"
    echo "⚠️  Please edit .env file with your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

# Make scripts executable
echo "🔐 Making scripts executable..."
chmod +x *.sh

# Install Docker (for Unmute integration)
echo "🐳 Installing Docker..."
apt install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Add user to docker group (if not root)
if [ "$USER" != "root" ]; then
    usermod -aG docker $USER
    echo "👤 Added $USER to docker group (logout/login required)"
fi

# Install NVIDIA Container Toolkit (for GPU support)
echo "🎮 Installing NVIDIA Container Toolkit..."
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
apt update
apt install -y nvidia-docker2
systemctl restart docker

# Test GPU access
echo "🧪 Testing GPU access..."
nvidia-smi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Supabase credentials:"
echo "   nano .env"
echo ""
echo "2. Start the application:"
echo "   npm start"
echo "   # or with Bun:"
echo "   bun start"
echo ""
echo "3. For Unmute voice assistant setup:"
echo "   Follow UNMUTE_INTEGRATION_GUIDE.md"
echo ""
echo "4. Access your app at:"
echo "   http://localhost:8081"
echo "   (Use RunPod's port forwarding to access externally)"
echo ""
echo "🔧 Useful commands:"
echo "   npm run dev     - Development mode"
echo "   npm run build   - Build for production"
echo "   docker ps       - Check running containers"
echo "   nvidia-smi      - Check GPU status"
echo ""