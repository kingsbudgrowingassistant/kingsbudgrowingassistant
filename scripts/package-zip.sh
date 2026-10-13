#!/bin/bash
# Package the Kings Bud Grow Assistant project into a downloadable ZIP file.
# Excludes node_modules, .next, .git, dev logs, and the download/ folder itself.

set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_ZIP="${PROJECT_DIR}/download/kings-bud-grow-assistant.zip"

# Make sure the download directory exists.
mkdir -p "${PROJECT_DIR}/download"

# Remove any previous zip.
rm -f "${OUTPUT_ZIP}"

cd "${PROJECT_DIR}"

# Create the zip. We use `zip` since it's universally compatible.
# Include dotfiles like .env.example, .gitignore — exclude dev/build artifacts.
zip -r "${OUTPUT_ZIP}" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "out/*" \
  -x ".git/*" \
  -x "download/*" \
  -x ".zscripts/*" \
  -x "db/*" \
  -x "dev.log" \
  -x "server.log" \
  -x ".DS_Store" \
  -x "*.pyc" \
  -x "tests/*" \
  -x "examples/*" \
  -x "skills/*" \
  -x "skills" \
  -x ".bun.lock" \
  -x "bun.lock" \
  -x "public/kings-bud.zip" \
  -x "static-html-export/kings-bud.zip" \
  -x "kings-bud.zip" \
  > /tmp/zip-build.log 2>&1 || {
    echo "zip command failed — falling back to tar.gz"
    cd "${PROJECT_DIR}"
    tar \
      --exclude='node_modules' \
      --exclude='.next' \
      --exclude='.git' \
      --exclude='download' \
      --exclude='.zscripts' \
      --exclude='db' \
      --exclude='dev.log' \
      --exclude='server.log' \
      --exclude='tests' \
      --exclude='examples' \
      -czf "${OUTPUT_ZIP%.zip}.tar.gz" .
    echo "Created: ${OUTPUT_ZIP%.zip}.tar.gz"
    ls -lh "${OUTPUT_ZIP%.zip}.tar.gz"
    exit 0
  }

echo "Created: ${OUTPUT_ZIP}"
ls -lh "${OUTPUT_ZIP}"
echo ""
echo "File listing (top-level):"
unzip -l "${OUTPUT_ZIP}" | head -30
