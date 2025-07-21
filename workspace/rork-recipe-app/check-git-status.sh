#!/bin/bash

echo "=== Checking Git Status ==="
pwd
echo ""

echo "=== Git Remote Info ==="
git remote -v
echo ""

echo "=== Git Status ==="
git status
echo ""

echo "=== Git Branch Info ==="
git branch -a
echo ""

echo "=== Last Few Commits ==="
git log --oneline -5