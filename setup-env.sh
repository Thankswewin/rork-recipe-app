#!/bin/bash

# RORK Recipe App - Environment Setup Script
# This script helps set up the .env file on RunPod

echo "🔧 Setting up environment configuration..."

# Install nano editor if not available
echo "📝 Installing nano editor..."
apt update
apt install -y nano vim

# Create .env file from template if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎯 IMPORTANT: Configure your Supabase credentials"
echo ""
echo "📝 Edit .env file with one of these methods:"
echo ""
echo "Method 1 - Using nano (recommended):"
echo "   nano .env"
echo ""
echo "Method 2 - Using vim:"
echo "   vim .env"
echo ""
echo "Method 3 - Using cat (for quick setup):"
echo "   cat > .env << 'EOF'"
echo "   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here"
echo "   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here"
echo "   EOF"
echo ""
echo "📋 Required Supabase Configuration:"
echo "   1. EXPO_PUBLIC_SUPABASE_URL - Your Supabase project URL"
echo "   2. EXPO_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key"
echo ""
echo "🔗 Get your Supabase credentials from:"
echo "   https://supabase.com/dashboard/project/[your-project]/settings/api"
echo ""
echo "💡 Quick setup command (replace with your actual values):"
echo 'cat > .env << "EOF"'
echo 'EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co'
echo 'EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here'
echo 'EOF'
echo ""
echo "🚀 After editing .env, start the app with:"
echo "   npm start"
echo ""