#!/bin/bash

echo "🔧 Git Pull Fix Script"
echo "====================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please navigate to your project directory."
    exit 1
fi

echo "📊 Current git status:"
git status --short

echo ""
echo "🔍 Checking for issues..."

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ You have uncommitted changes."
    echo ""
    echo "Choose an option:"
    echo "1. Stash changes (recommended)"
    echo "2. Commit changes"
    echo "3. Discard all changes (DANGEROUS)"
    echo "4. Show me what changed"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            echo "📦 Stashing changes..."
            git stash push -m "Auto-stash before pull $(date)"
            echo "✅ Changes stashed"
            ;;
        2)
            echo "💾 Committing changes..."
            git add .
            git commit -m "Auto-commit before pull $(date)"
            echo "✅ Changes committed"
            ;;
        3)
            echo "⚠️ This will permanently delete your changes!"
            read -p "Are you sure? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                git reset --hard HEAD
                git clean -fd
                echo "✅ Changes discarded"
            else
                echo "❌ Cancelled"
                exit 1
            fi
            ;;
        4)
            echo "📝 Changed files:"
            git diff --name-only
            echo ""
            echo "📄 Detailed changes:"
            git diff
            echo ""
            echo "Run this script again to continue."
            exit 0
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
fi

echo ""
echo "📥 Attempting git pull..."

# Try different pull strategies
if git pull; then
    echo "✅ Git pull successful!"
elif git pull --rebase; then
    echo "✅ Git pull with rebase successful!"
elif git pull --allow-unrelated-histories; then
    echo "✅ Git pull with unrelated histories successful!"
else
    echo "❌ Git pull failed. Trying advanced fixes..."
    
    echo "🔍 Diagnosing the issue..."
    echo "Current branch: $(git branch --show-current)"
    echo "Remote URL: $(git remote get-url origin)"
    echo ""
    
    echo "🔧 Attempting force sync..."
    git fetch origin
    
    # Get the default branch name
    DEFAULT_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5)
    if [ -z "$DEFAULT_BRANCH" ]; then
        DEFAULT_BRANCH="main"
    fi
    
    echo "📌 Default branch: $DEFAULT_BRANCH"
    
    echo "⚠️ This will reset your local branch to match the remote."
    read -p "Continue? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        git reset --hard origin/$DEFAULT_BRANCH
        echo "✅ Force sync completed!"
    else
        echo "❌ Cancelled. Manual intervention required."
        echo ""
        echo "🔧 Manual options:"
        echo "1. git reset --hard origin/$DEFAULT_BRANCH"
        echo "2. git pull origin $DEFAULT_BRANCH --allow-unrelated-histories"
        echo "3. Check if you have the correct repository URL"
        exit 1
    fi
fi

echo ""
echo "🎉 Git pull fix completed!"
echo "📊 Final status:"
git status --short

# If there were stashed changes, remind user
if git stash list | grep -q "Auto-stash"; then
    echo ""
    echo "💡 You have stashed changes. To restore them:"
    echo "   git stash pop"
fi