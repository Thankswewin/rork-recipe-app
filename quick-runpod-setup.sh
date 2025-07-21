#!/bin/bash

echo "⚡ Quick RunPod Setup"
echo "===================="

# Navigate to workspace
cd /workspace

# Remove old directory if it exists
if [ -d "rork-recipe-app" ]; then
    echo "🗑️  Removing old rork-recipe-app directory..."
    rm -rf rork-recipe-app
fi

# Clone fresh repository
echo "📥 Cloning fresh repository..."
git clone https://github.com/Thankswewin/rork-recipe-app.git

# Navigate to project
cd rork-recipe-app

# Make scripts executable
chmod +x *.sh

# Install bun if needed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo "✅ Setup complete! Now run: ./runpod-fix-and-start.sh"