#!/bin/bash

echo "🔧 RunPod Troubleshooting Script"
echo "================================"

# Function to fix git issues
fix_git_issues() {
    echo ""
    echo "🔍 Checking Git Issues..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        echo "❌ Not in a git repository"
        return 1
    fi
    
    # Check git status
    echo "📊 Git Status:"
    git status --porcelain
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️ Found uncommitted changes. Options:"
        echo "1. Stash changes: git stash"
        echo "2. Commit changes: git add . && git commit -m 'temp commit'"
        echo "3. Discard changes: git reset --hard HEAD"
        
        read -p "Choose option (1/2/3) or press Enter to skip: " choice
        case $choice in
            1) git stash push -m "RunPod auto-stash $(date)" ;;
            2) git add . && git commit -m "RunPod temp commit $(date)" ;;
            3) git reset --hard HEAD ;;
            *) echo "Skipping..." ;;
        esac
    fi
    
    # Try different pull strategies
    echo "📥 Attempting git pull..."
    
    # Method 1: Simple pull
    if git pull 2>/dev/null; then
        echo "✅ Git pull successful!"
        return 0
    fi
    
    # Method 2: Pull with rebase
    echo "🔄 Trying pull with rebase..."
    if git pull --rebase 2>/dev/null; then
        echo "✅ Git pull with rebase successful!"
        return 0
    fi
    
    # Method 3: Fetch and merge
    echo "🔄 Trying fetch and merge..."
    git fetch origin
    if git merge origin/$(git branch --show-current) 2>/dev/null; then
        echo "✅ Fetch and merge successful!"
        return 0
    fi
    
    # Method 4: Show what's wrong
    echo "❌ Git pull failed. Showing details:"
    echo "Current branch: $(git branch --show-current)"
    echo "Remote branches:"
    git branch -r
    echo "Last few commits:"
    git log --oneline -5
    
    echo ""
    echo "🔧 Manual fix options:"
    echo "1. git reset --hard origin/main  # Discard all local changes"
    echo "2. git pull origin main --allow-unrelated-histories"
    echo "3. Check if you have the right repository URL"
}

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

# Run git troubleshooting if requested
if [ "$1" = "git" ] || [ "$1" = "all" ]; then
    fix_git_issues
fi

echo ""
echo "📋 Quick Fix Commands:"
echo "1. Fix git issues: ./runpod-troubleshoot.sh git"
echo "2. Full setup: chmod +x setup-runpod-complete.sh && ./setup-runpod-complete.sh"
echo "3. Start app: chmod +x start-app.sh && ./start-app.sh"
echo "4. SSH access: ssh root@$PUBLIC_IP -p 22 (password: runpod123)"
echo ""
echo "📱 For iOS connection issues:"
echo "- Make sure you're using Expo Go app (not camera)"
echo "- Try the tunnel URL if QR code doesn't work"
echo "- Check that ports 8000,8001 are exposed in RunPod settings"
echo ""
echo "🔧 Git Issues:"
echo "- Run: ./runpod-troubleshoot.sh git"
echo "- Or manually: git stash && git pull"
echo "- Force reset: git reset --hard origin/main"