#!/bin/bash

# Fix CI Dependencies Script for Meqenet
# This script resolves the react-native-certificate-pinning 404 error
# and regenerates clean lockfiles

set -e

echo "🔧 Fixing CI Dependencies for Meqenet..."

# Step 1: Clean all caches and lockfiles
echo "🧹 Cleaning caches and lockfiles..."
rm -rf node_modules pnpm-lock.yaml yarn.lock package-lock.json
rm -rf frontend/node_modules frontend/pnpm-lock.yaml
rm -rf backend/node_modules backend/pnpm-lock.yaml

# Step 2: Clear pnpm cache
echo "🗑️  Clearing pnpm cache..."
pnpm store prune

# Step 3: Install dependencies with fresh state
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile=false

# Step 4: Verify SSL pinning package
echo "🔒 Verifying react-native-ssl-pinning package..."
if pnpm list | grep -q "react-native-ssl-pinning"; then
    echo "✅ react-native-ssl-pinning is properly installed"
else
    echo "❌ react-native-ssl-pinning not found, installing..."
    cd frontend/apps/app
    pnpm add react-native-ssl-pinning@^1.5.7
    cd ../../..
fi

# Step 5: Generate new lockfile
echo "🔐 Generating new lockfile..."
pnpm install --lockfile-only

# Step 6: Verify no problematic packages
echo "🔍 Verifying no problematic packages..."
if pnpm list | grep -q "react-native-certificate-pinning"; then
    echo "❌ ERROR: react-native-certificate-pinning still found!"
    exit 1
else
    echo "✅ No problematic packages found"
fi

echo "🎉 CI Dependencies fixed successfully!"
echo ""
echo "Next steps for CI:"
echo "1. Commit the new pnpm-lock.yaml file"
echo "2. Clear CI cache if using cached dependencies"
echo "3. Run CI pipeline again"
