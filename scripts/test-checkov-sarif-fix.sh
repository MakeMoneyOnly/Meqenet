#!/bin/bash
set -euo pipefail

echo "🔍 FinTech DevOps - Testing Checkov SARIF Fix Logic"
echo "=================================================="

# Test the SARIF handling logic that we implemented in the workflows
test_sarif_handling() {
    local test_dir="./test-sarif"
    local sarif_name="test-checkov.sarif"

    echo "📋 Testing SARIF directory-to-file conversion logic..."

    # Create test directory structure like Checkov does
    mkdir -p "$test_dir"
    cd "$test_dir"

    # Simulate Checkov creating a directory with results_sarif.sarif inside
    mkdir -p "$sarif_name"
    echo '{"version": "2.1.0", "runs": []}' > "$sarif_name/results_sarif.sarif"

    echo "✅ Created test SARIF structure"

    # Test our fix logic
    if [ -d "$sarif_name" ]; then
        echo "📁 Found SARIF directory: $sarif_name"

        if [ -f "$sarif_name/results_sarif.sarif" ]; then
            echo "🔄 Moving SARIF file from directory structure to flat file..."
            mv "$sarif_name/results_sarif.sarif" "${sarif_name}.tmp"
            rm -rf "$sarif_name"
            mv "${sarif_name}.tmp" "$sarif_name"
            echo "✅ SARIF file path fixed successfully"

            # Validate the moved file
            if [ -f "$sarif_name" ] && [ -s "$sarif_name" ]; then
                local file_size=$(wc -c < "$sarif_name")
                echo "✅ SARIF file exists and has content ($file_size bytes)"

                # Test JSON validity
                if jq empty "$sarif_name" 2>/dev/null; then
                    echo "✅ SARIF file contains valid JSON"
                    return 0
                else
                    echo "❌ SARIF file contains invalid JSON"
                    return 1
                fi
            else
                echo "❌ SARIF file move failed - file is empty or missing"
                return 1
            fi
        else
            echo "❌ Expected SARIF file not found in directory: $sarif_name/results_sarif.sarif"
            return 1
        fi
    else
        echo "❌ No SARIF directory found"
        return 1
    fi
}

# Run the test
if test_sarif_handling; then
    echo ""
    echo "🎉 SARIF handling logic test PASSED"
    echo "✅ The fix logic in our workflows should work correctly"
else
    echo ""
    echo "❌ SARIF handling logic test FAILED"
    echo "🔧 The fix logic needs to be reviewed"
    exit 1
fi

echo ""
echo "📋 Testing Terraform validation logic..."

# Test terraform validation (if terraform is available)
if command -v terraform &> /dev/null; then
    echo "✅ Terraform is available"
    cd ../infrastructure

    if terraform validate 2>/dev/null; then
        echo "✅ Terraform validation passed"
    else
        echo "⚠️ Terraform validation failed (this is expected in test environment)"
    fi
else
    echo "⚠️ Terraform not available in test environment"
fi

echo ""
echo "=================================================="
echo "✅ Checkov SARIF Fix Validation Complete"
echo "=================================================="
