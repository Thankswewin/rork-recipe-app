#!/bin/bash

echo "🔧 Complete RunPod Fix and Start Script"
echo "======================================="

# Make scripts executable
chmod +x setup-runpod-complete.sh
chmod +x start-app.sh
chmod +x kill-all-processes.sh

# Step 1: Run complete setup
echo "🚀 Running complete setup..."
./setup-runpod-complete.sh

# Step 2: Source bashrc to get Bun in PATH
echo "🔄 Refreshing environment..."
source ~/.bashrc

# Step 3: Start the app
echo "🚀 Starting the app..."
./start-app.sh