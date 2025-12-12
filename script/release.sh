#!/bin/bash
set -e

echo "🏋️ Compiling..."
npx tsc || { echo "❌ TypeScript compilation failed"; exit 1; }

# Get the version from tauri.conf.json
VERSION=$(jq -r '.version' src-tauri/tauri.conf.json)
TAG="v$VERSION"

echo "📦 Creating release for version $VERSION..."

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "❌ Tag $TAG already exists. Please bump the version first."
    exit 1
fi

# Create and push tag
echo "🏷️ Creating tag $TAG..."
git tag -a "$TAG" -m "Release $TAG"

echo "🚀 Pushing tag to origin..."
git push origin "$TAG"

echo "✅ Done! Release workflow will start automatically."
echo "👀 Check status at https://github.com/meltylabs/chorus-oss/actions"
