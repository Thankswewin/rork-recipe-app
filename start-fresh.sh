#!/bin/bash

echo "🔄 Starting fresh RunPod setup..."

# Kill any existing processes on common ports
echo "🛑 Killing existing processes..."
pkill -f "expo" || true
pkill -f "bun" || true
pkill -f "node" || true
pkill -f "8081" || true
pkill -f "19000" || true
pkill -f "19001" || true
pkill -f "19002" || true

# Wait a moment for processes to die
sleep 2

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Verify bun installation
echo "🔍 Checking Bun version..."
bun --version

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Start the app
echo "🚀 Starting the app..."
bun start
