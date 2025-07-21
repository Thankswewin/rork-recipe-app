#!/bin/bash

echo "=== Checking Git Status ==="
pwd
echo ""

echo "=== Git Remote Info ==="
git remote -v
echo ""

echo "=== Current Branch ==="
git branch
echo ""

echo "=== Git Status ==="
git status
echo ""

echo "=== Fetching Latest Changes ==="
git fetch origin
echo ""

echo "=== Checking if Behind ==="
git log HEAD..origin/main --oneline 2>/dev/null || git log HEAD..origin/master --oneline 2>/dev/null
echo ""

echo "=== Last Few Commits ==="
git log --oneline -5
echo ""

echo "=== To pull latest changes, run: ==="
echo "git pull origin main"
echo "or"
echo "git pull origin master"