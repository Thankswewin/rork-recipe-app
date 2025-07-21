#!/bin/bash

echo "🔧 RunPod Troubleshooting Script"
echo "================================"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "🌐 Your RunPod Public IP: $PUBLIC_IP"

# Check SSH service
echo ""
echo "🔐 SSH Service Status:"
service ssh status || echo "SSH not running"

# Check open ports
echo ""
echo "🔌 Open Ports:"
ss -tulpn | grep LISTEN | grep -E ':(22|8000|8001)' || echo "No ports 22, 8000, 8001 listening"

# Check if Bun is installed
echo ""
echo "🍞 Bun Status:"
if command -v bun &> /dev/null; then
    echo "✅ Bun installed: $(bun --version)"
else
    echo "❌ Bun not found"
    echo "Run: chmod +x setup-runpod-complete.sh && ./setup-runpod-complete.sh"
fi

# Check project files
echo ""
echo "📁 Project Files:"
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
fi

if [ -f "app.json" ]; then
    echo "✅ app.json found"
else
    echo "❌ app.json not found"
fi

# Check environment
echo ""
echo "🌍 Environment:"
if [ -f ".env" ]; then
    echo "✅ .env file exists:"
    cat .env
else
    echo "❌ .env file not found"
    echo "Creating default .env..."
    echo "EXPO_PUBLIC_API_URL=http://$PUBLIC_IP:8000" > .env
fi

# Check running processes
echo ""
echo "🏃 Running Processes:"
ps aux | grep -E "(bun|expo|node)" | grep -v grep || echo "No relevant processes running"

echo ""
echo "📋 Quick Fix Commands:"
echo "1. Full setup: chmod +x setup-runpod-complete.sh && ./setup-runpod-complete.sh"
echo "2. Start app: chmod +x start-app.sh && ./start-app.sh"
echo "3. SSH access: ssh root@$PUBLIC_IP -p 22 (password: runpod123)"
echo ""
echo "📱 For iOS connection issues:"
echo "- Make sure you're using Expo Go app (not camera)"
echo "- Try the tunnel URL if QR code doesn't work"
echo "- Check that ports 8000,8001 are exposed in RunPod settings"