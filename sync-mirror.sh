#!/bin/bash

# Mirror Sync Script
# This script syncs changes from the source repository to the mirror

set -e

REPO_DIR="/Users/joshuadazas/coding/learning-coach-mirror"
cd "$REPO_DIR"

echo "🔄 Starting mirror sync..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Fetch latest changes from source
echo "📥 Fetching changes from source..."
git fetch source

# Check if there are any changes
if git diff --quiet HEAD source/main; then
    echo "✅ No changes to sync"
    exit 0
fi

echo "🔄 Changes detected, merging..."

# Merge changes
git merge source/main --no-edit

# Push to origin
echo "📤 Pushing to origin..."
git push origin main

echo "✅ Mirror sync completed successfully!"

# Show recent commits
echo "📋 Recent commits:"
git log --oneline -5
