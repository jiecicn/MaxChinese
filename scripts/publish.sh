#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SITE_DIR="$PROJECT_ROOT/site"
TEMP_DIR=$(mktemp -d)

echo "=== MaxChinese Publish ==="

# Step 1: Run build (generates site/data/ and site/config.js)
echo "Building site data..."
python "$SCRIPT_DIR/build.py"

# Step 2: Copy entire site/ (including generated files) to temp dir
echo "Preparing publish directory..."
cp -r "$SITE_DIR"/* "$TEMP_DIR"/

# Step 3: Create/update gh-pages branch with ONLY the site content
cd "$TEMP_DIR"
git init
git checkout -b gh-pages
git add -A
git commit -m "publish: update site $(date +%Y-%m-%d)"

# Step 4: Force push to gh-pages (this branch only contains site files)
git remote add origin https://github.com/jiecicn/MaxChinese.git
git push -f origin gh-pages

# Cleanup
rm -rf "$TEMP_DIR"

echo "=== Published! ==="
echo "Max can view at: https://jiecicn.github.io/MaxChinese/"
