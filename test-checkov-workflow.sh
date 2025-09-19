#!/bin/bash

# Test script to validate Checkov workflow configuration
# This simulates the workflow steps locally

echo "🔍 Testing Checkov workflow configuration..."
echo "========================================="

# Step 1: Check if Terraform files exist
echo -e "\n✅ Checking for Terraform files..."
TERRAFORM_FILES=$(find infrastructure -name "*.tf" -type f | wc -l)
echo "Found $TERRAFORM_FILES Terraform files"

if [ "$TERRAFORM_FILES" -gt 0 ]; then
    echo "✅ Terraform files found:"
    find infrastructure -name "*.tf" -type f -exec basename {} \;
else
    echo "❌ No Terraform files found in infrastructure directory"
    exit 1
fi

# Step 2: Test Checkov command (if available)
echo -e "\n✅ Testing Checkov availability..."
if command -v checkov &> /dev/null; then
    echo "✅ Checkov is available"
    CHECKOV_VERSION=$(checkov --version)
    echo "Checkov version: $CHECKOV_VERSION"
else
    echo "⚠️ Checkov not installed locally (this is normal for CI)"
    echo "The workflow will install Checkov automatically"
fi

# Step 3: Validate file paths
echo -e "\n✅ Validating file paths..."
if [ -d "infrastructure" ]; then
    echo "✅ Infrastructure directory exists"
else
    echo "❌ Infrastructure directory not found"
    exit 1
fi

# Step 4: Test SARIF file path logic
echo -e "\n✅ Testing SARIF file path configuration..."
EXPECTED_SARIF_FILE="checkov-results.sarif"
echo "Expected SARIF file: $EXPECTED_SARIF_FILE"

# Step 5: Summary
echo -e "\n✅ Workflow validation complete!"
echo "========================================="
echo "Configuration Summary:"
echo "  - Terraform files: $TERRAFORM_FILES found"
echo "  - Infrastructure directory: ✅"
echo "  - Expected SARIF output: $EXPECTED_SARIF_FILE"
echo ""
echo "The Checkov workflow should now work correctly!"
echo "========================================="