#!/bin/bash

echo "🔍 Checking for running processes..."

# Kill any Node.js processes
echo "🛑 Killing Node.js processes..."
pkill -f node || echo "No Node.js processes found"

# Kill any Bun processes
echo "🛑 Killing Bun processes..."
pkill -f bun || echo "No Bun processes found"

# Kill any Expo processes
echo "🛑 Killing Expo processes..."
pkill -f expo || echo "No Expo processes found"

# Kill processes on common development ports
echo "🛑 Killing processes on development ports..."
for port in 3000 8081 19000 19001 19002 8000 4000 5000; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid
    fi
done

echo "✅ Process cleanup complete!"

# Show remaining processes (optional)
echo ""
echo "📊 Remaining processes using common ports:"
for port in 3000 8081 19000 19001 19002 8000 4000 5000; do
    if lsof -i:$port 2>/dev/null; then
        echo "Port $port is still in use"
    fi
done