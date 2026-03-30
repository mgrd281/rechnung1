#!/bin/bash

# Configuration
REPO_DIR="/Users/m/Desktop/rechnung 6"
BRANCH="main"
INTERVAL=30

echo "🔄 Starting GitHub Auto-Sync for $REPO_DIR"

cd "$REPO_DIR" || exit 1

while true; do
    # Check for changes
    if [[ -n $(git status --porcelain) ]]; then
        echo "✨ Changes detected at $(date '+%Y-%m-%d %H:%M:%S')"
        
        # Pull latest changes first to avoid conflicts
        git pull origin "$BRANCH" --rebase
        
        # Add all changes
        git add .
        
        # Commit
        git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
        
        # Push
        git push origin "$BRANCH"
        
        echo "✅ Synced to GitHub"
    fi
    
    sleep "$INTERVAL"
done
