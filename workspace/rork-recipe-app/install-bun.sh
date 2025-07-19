#!/bin/bash

echo "🚀 Installing Bun..."

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Add Bun to PATH permanently
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

echo "✅ Bun installation complete!"
echo "Bun version: $(~/.bun/bin/bun --version)"

echo ""
echo "📝 Next steps:"
echo "1. Run: source ~/.bashrc"
echo "2. Or start a new shell session"
echo "3. Then run: bun --version to verify"