#!/bin/bash

echo "🚀 Installing Bun..."

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Add Bun to bashrc for future sessions
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

echo "✅ Bun installation complete!"
echo "🔄 Please run: source ~/.bashrc"
echo "📦 Then run: bun install"