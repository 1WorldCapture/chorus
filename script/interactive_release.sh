#!/bin/bash

set -e

echo "🚀 Starting interactive release process..."

echo "🎨 Running format checks..."
if ! pnpm format:check; then
    echo "❌ Formatting issues found. Run 'pnpm format' to fix them."
    exit 1
fi

echo "✅ All format checks passed!"

echo "Running pnpm tsc..."
pnpm exec tsc

# Step 0: Pull latest from origin/main
echo "📥 Pulling latest changes from origin/main..."
git pull origin main

# Step 1: Bump version
echo "🔢 Version bumping..."
read -p "Do you want to bump a patch (0.0.1), minor version (0.1.0), or skip bumping? (patch/minor/skip): " bump_type
while [[ "$bump_type" != "patch" && "$bump_type" != "minor" && "$bump_type" != "skip" ]]; do
    read -p "Invalid input. Please enter 'patch', 'minor', or 'skip': " bump_type
done

if [[ "$bump_type" != "skip" ]]; then
    # Store the current version before bumping
    current_version=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

    ./script/bump_version.sh "$bump_type"

    # Get the new version after bumping
    new_version=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
    echo "Version bumped from $current_version to $new_version"

    # Also update the version in dev and qa config files
    sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" src-tauri/tauri.dev.conf.json
    sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" src-tauri/tauri.qa.conf.json

    read -p "Do you want to continue with this version? (yes/no) [yes]: " confirm
    if [[ "$confirm" != "yes" && "$confirm" != "" ]]; then
        echo "Undoing version bump..."
        # Restore the original versions in all files
        sed -i '' "s/\"version\": \"$new_version\"/\"version\": \"$current_version\"/" package.json
        sed -i '' "s/\"version\": \"$new_version\"/\"version\": \"$current_version\"/" src-tauri/tauri.conf.json
        sed -i '' "s/\"version\": \"$new_version\"/\"version\": \"$current_version\"/" src-tauri/tauri.dev.conf.json
        sed -i '' "s/\"version\": \"$new_version\"/\"version\": \"$current_version\"/" src-tauri/tauri.qa.conf.json
        echo "Version bump undone. Exiting..."
        exit 1
    fi

    # Step 2: Commit and push version bump to main
    echo "📤 Committing version bump..."
    git add package.json src-tauri/tauri.conf.json src-tauri/tauri.dev.conf.json src-tauri/tauri.qa.conf.json
    git commit -m "Bump version to $new_version"
    git push origin main
else
    echo "Skipping version bump."
fi

# Step 3: Run release script (creates and pushes tag)
echo "🚀 Running release script..."
./script/release.sh

echo "✅ Interactive release process completed!"
echo "📝 Don't forget to update the changelog after the release is published."
