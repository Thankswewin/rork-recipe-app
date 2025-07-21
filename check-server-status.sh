#!/bin/bash

echo "🔍 Server Status Check"
echo "====================="

# Check if processes are running
echo "📊 Running processes:"
ps aux | grep -E "(expo|bun|rork)" | grep -v grep

echo ""
echo "🌐 Network connections:"
netstat -tlnp | grep -E "(8081|19000|19001|19002)"

echo ""
echo "🔗 Tunnel status:"
if pgrep -f "tunnel" > /dev/null; then
    echo "✅ Tunnel process is running"
else
    echo "❌ No tunnel process found"
fi

echo ""
echo "📱 Expo CLI status:"
if command -v expo &> /dev/null; then
    echo "✅ Expo CLI is available"
    expo --version
else
    echo "❌ Expo CLI not found"
fi

echo ""
echo "🔧 Bun status:"
if command -v bun &> /dev/null; then
    echo "✅ Bun is available"
    bun --version
else
    echo "❌ Bun not found"
fi