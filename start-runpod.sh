#!/bin/bash

# RORK Recipe App - RunPod Startup Script
# This script starts the app using standard Expo CLI instead of custom rork command

echo "🚀 Starting RORK Recipe App on RunPod..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created (using fallback Supabase credentials)"
    echo ""
fi

echo "🌐 Starting Expo development server..."
echo "📍 Server will be available at: http://localhost:8081"
echo "🔗 Access via RunPod HTTP Service tab on port 8081"
echo ""
echo "💡 Available commands:"
echo "   npm run start-expo    - Standard Expo server"
echo "   npm run start-runpod  - Web-optimized for RunPod"
echo "   npm run dev           - Development client mode"
echo ""

# Start the app with web support for RunPod
npm run start-runpod