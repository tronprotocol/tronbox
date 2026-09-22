#!/usr/bin/env bash

# --- Error Handling & Safety Rules ---
# -e: Exit immediately if a command fails
# -u: Treat unset variables as an error
# -o pipefail: Catch errors within pipelines
set -eou pipefail

# --- Configuration ---
SOURCE_DIR="src"
BUILD_DIR="build"
BABEL_BIN="./node_modules/.bin/babel"

echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR"

# Ensure Babel exists before execution (Fail-fast)
if [[ ! -f "$BABEL_BIN" ]]; then
    echo "❌ Error: Babel binary not found at $BABEL_BIN. Run 'npm install' first."
    exit 1
fi

echo "🚀 Transpiling source code with Babel..."
# --minified: Shrinks code size
# --no-comments: Removes developer notes (Security: hides sensitive TODOs)
"$BABEL_BIN" --minified --no-comments "$SOURCE_DIR" -d "$BUILD_DIR"

[Image of JavaScript compilation process with Babel from ES6 to ES5]

echo "📦 Copying static assets and schemas..."
# Using --parents or creating dirs to ensure path integrity
mkdir -p "$BUILD_DIR/components/ContractSchema/spec"
cp -r "$SOURCE_DIR/components/ContractSchema/spec/"* "$BUILD_DIR/components/ContractSchema/spec/"

echo "📜 Preparing execution scripts..."
# Copying the utility script and securing permissions
cp scripts/tronbox.js "$BUILD_DIR/"

# Security Check: Only add execution bit to the specific script
chmod +x "$BUILD_DIR/tronbox.js"

[Image of a build pipeline architecture showing source to distribution flow]

echo "✅ Build process completed successfully!"
