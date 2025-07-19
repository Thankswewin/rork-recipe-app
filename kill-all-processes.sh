#!/bin/bash

echo "🔍 Checking for running processes..."

# Kill all node/bun processes
echo "🚫 Killing all Node.js and Bun processes..."
pkill -f node
pkill -f bun
pkill -f expo
pkill -f rork

# Kill processes on common ports
echo "🚫 Killing processes on common ports..."
for port in 8081 3000 19000 19001 19002 8000 8080 4000; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done

# Alternative method using fuser if lsof doesn't work
echo "🚫 Using fuser to kill remaining processes..."
for port in 8081 3000 19000 19001 19002 8000 8080 4000; do
    fuser -k $port/tcp 2>/dev/null
done

# Show remaining processes
echo "📊 Remaining processes:"
ps aux | grep -E "(node|bun|expo|rork)" | grep -v grep || echo "No processes found"

echo "✅ Cleanup complete!"
echo ""
echo "🚀 Now you can safely run: bun run start"