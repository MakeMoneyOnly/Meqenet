#!/bin/bash

# Meqenet Lockfile Validation Script
# This script validates that the PNPM lockfile is consistent with the current configuration
# and can be used to test lockfile regeneration if needed.

set -euo pipefail

echo "🔍 Validating PNPM lockfile consistency..."

# Test frozen lockfile installation
echo "📦 Testing frozen lockfile installation..."
if pnpm install --frozen-lockfile --ignore-scripts > /dev/null 2>&1; then
    echo "✅ Lockfile is consistent and frozen installation works"
else
    echo "❌ Lockfile consistency issue detected"

    # Check if it's a configuration mismatch
    if pnpm install --frozen-lockfile --ignore-scripts 2>&1 | grep -q "ERR_PNPM_LOCKFILE_CONFIG_MISMATCH"; then
        echo "🔧 Detected lockfile configuration mismatch"
        echo "🔄 Regenerating lockfile..."

        # Regenerate the lockfile
        if pnpm install --no-frozen-lockfile --ignore-scripts > /dev/null 2>&1; then
            echo "✅ Lockfile regenerated successfully"

            # Test the regenerated lockfile
            if pnpm install --frozen-lockfile --ignore-scripts > /dev/null 2>&1; then
                echo "✅ Regenerated lockfile is now consistent"
            else
                echo "❌ Regenerated lockfile still has issues"
                exit 1
            fi
        else
            echo "❌ Failed to regenerate lockfile"
            exit 1
        fi
    else
        echo "❌ Different lockfile issue detected (not configuration mismatch)"
        exit 1
    fi
fi

echo "🎉 Lockfile validation completed successfully"
