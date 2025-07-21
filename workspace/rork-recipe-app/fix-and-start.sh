#!/bin/bash

echo "🚀 One-Command RunPod Fix & Start"
echo "================================="

# Make all scripts executable
chmod +x *.sh

# Run complete setup
echo "🔧 Running complete setup..."
./setup-runpod-complete.sh

# Start the app
echo "📱 Starting the app..."
./start-app.sh