#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== MaxChinese Publish ==="

# Step 1: Run build
echo "Building site data..."
python3 "$SCRIPT_DIR/build.py"

# Step 2: Copy content data to site
echo "Data files ready in site/data/"

# Step 3: Push to GitHub Pages
# Using git subtree push for the site/ directory
cd "$PROJECT_ROOT"

# Ensure everything is committed
if [[ -n $(git status --porcelain) ]]; then
  echo "ERROR: Uncommitted changes. Commit or stash before publishing."
  exit 1
fi

echo "Pushing site/ to gh-pages branch..."
git subtree push --prefix site origin gh-pages

echo "=== Published! ==="
echo "Max can view at: https://<username>.github.io/<repo-name>/"
