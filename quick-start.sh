#!/bin/bash

echo "⚡ Quick Start Script"

# Source bashrc to get bun in PATH
source ~/.bashrc
export PATH="$HOME/.bun/bin:$PATH"

# Kill existing processes
pkill -f "expo" 2>/dev/null || true
pkill -f "bun" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true

sleep 1

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the app directory."
    exit 1
fi

# Start the app
echo "🚀 Starting app..."
bun start