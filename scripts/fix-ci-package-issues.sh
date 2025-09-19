#!/bin/bash

# Meqenet CI/CD Package Issue Fix Script
# This script addresses common dependency resolution issues in CI/CD

set -e

echo "🔧 Meqenet CI/CD Package Fix Script"
echo "=================================="

# Function to check and fix @types/argon2 version
fix_argon2_types() {
    echo "🔍 Checking @types/argon2 versions..."

    # Find all package.json files that reference @types/argon2
    find . -name "package.json" -type f -exec grep -l "@types/argon2" {} \;

    for package_file in $(find . -name "package.json" -type f -exec grep -l "@types/argon2" {} \;); do
        echo "📝 Checking $package_file..."

        # Check if it has the problematic version
        if grep -q "@types/argon2.*[\"^]*1\.7\." "$package_file"; then
            echo "⚠️  Found problematic @types/argon2 version in $package_file"

            # Create backup
            cp "$package_file" "${package_file}.backup"

            # Fix the version to match the override in root package.json
            sed -i 's/"@types\/argon2": "[^"]*"/"@types\/argon2": "0.15.4"/g' "$package_file"

            echo "✅ Fixed @types/argon2 version in $package_file"
        else
            echo "✅ @types/argon2 version is correct in $package_file"
        fi
    done
}

# Function to validate Node.js compatibility
validate_node_version() {
    echo "🔍 Validating Node.js compatibility..."

    REQUIRED_NODE_MAJOR=22
    CURRENT_NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)

    if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_MAJOR" ]; then
        echo "❌ Node.js version $CURRENT_NODE_VERSION is below required version $REQUIRED_NODE_MAJOR"
        echo "🔧 This may cause dependency resolution issues"
        echo "💡 Please ensure CI runner uses Node.js v22+"
        exit 1
    else
        echo "✅ Node.js version $CURRENT_NODE_VERSION is compatible"
    fi
}

# Function to clean problematic caches
clean_caches() {
    echo "🧹 Cleaning problematic caches..."

    # Clean pnpm store if available
    if command -v pnpm &> /dev/null; then
        echo "🧹 Cleaning pnpm store..."
        pnpm store prune
    fi

    # Clean npm cache if available
    if command -v npm &> /dev/null; then
        echo "🧹 Cleaning npm cache..."
        npm cache clean --force
    fi

    echo "✅ Cache cleanup completed"
}

# Function to validate package.json consistency
validate_package_consistency() {
    echo "🔍 Validating package.json consistency..."

    # Check if root package.json has proper overrides
    if ! grep -q '"@types/argon2": "0.15.4"' package.json; then
        echo "⚠️  Root package.json may be missing @types/argon2 override"
        echo "🔧 Adding override to root package.json..."

        # Add the override if it doesn't exist
        if ! grep -q '"overrides"' package.json; then
            # Add overrides section
            sed -i '/"pnpm": {/i\
  "overrides": {\
    "@types/argon2": "0.15.4"\
  },\
' package.json
        else
            # Add to existing overrides
            sed -i '/"overrides": {/a\
    "@types/argon2": "0.15.4",\
' package.json
        fi

        echo "✅ Added @types/argon2 override to root package.json"
    fi
}

# Main execution
echo "🚀 Starting package fix process..."

# Run all fix functions
validate_node_version
clean_caches
fix_argon2_types
validate_package_consistency

echo "🎉 Package fix process completed successfully!"
echo ""
echo "📋 Summary of fixes applied:"
echo "   • Validated Node.js version compatibility"
echo "   • Cleaned problematic caches"
echo "   • Fixed @types/argon2 version conflicts"
echo "   • Ensured package.json consistency"
echo ""
echo "💡 If issues persist, please check:"
echo "   • GitHub Actions runner Node.js version"
echo "   • pnpm version compatibility"
echo "   • Network connectivity to npm registry"