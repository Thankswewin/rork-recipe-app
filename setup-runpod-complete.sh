#!/bin/bash

echo "=== Complete RunPod Setup for React Native App ==="

# Update system
apt update && apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Install Bun
echo "Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Install additional dependencies
echo "Installing additional dependencies..."
apt-get install -y \
    curl \
    wget \
    unzip \
    build-essential \
    python3 \
    python3-pip

# Install Expo CLI globally
echo "Installing Expo CLI..."
npm install -g @expo/cli

# Verify installations
echo "=== Verification ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Bun: $(bun --version)"
echo "Expo CLI: $(expo --version)"
echo "Git: $(git --version)"

echo "=== Setup Complete! ==="
echo "You can now:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Install dependencies: bun install"
echo "3. Start development server: bun expo start"