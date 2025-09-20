#!/bin/bash

# FinTech DevOps - Checkov Configuration Validator
# Validates Checkov setup for Meqenet Infrastructure Security Scanning

set -euo pipefail

echo "🔍 FinTech DevOps - Checkov Configuration Validator"
echo "=================================================="
echo "Repository: Meqenet (BNPL Super-App, Ethiopia)"
echo "Validation Date: $(date)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️${NC} $message"
            ;;
        "error")
            echo -e "${RED}❌${NC} $message"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -d "infrastructure" ]; then
    print_status "error" "Infrastructure directory not found. Run from project root."
    exit 1
fi

print_status "info" "Validating Terraform files in infrastructure directory..."

# Count Terraform files
TERRAFORM_FILES=$(find infrastructure -name "*.tf" -type f | wc -l)
echo "Found $TERRAFORM_FILES Terraform files:"
find infrastructure -name "*.tf" -type f -exec basename {} \; | sed 's/^/  - /'

if [ "$TERRAFORM_FILES" -eq 0 ]; then
    print_status "error" "No Terraform files found in infrastructure directory"
    print_status "error" "Checkov will fail without Terraform files to scan"
    exit 1
fi

print_status "success" "Terraform files validation passed"

# Check Checkov installation (if available)
echo ""
print_status "info" "Checking Checkov availability..."

if command -v checkov &> /dev/null; then
    CHECKOV_VERSION=$(checkov --version 2>/dev/null || echo "unknown")
    print_status "success" "Checkov is available (version: $CHECKOV_VERSION)"

    # Test Checkov scan
    echo ""
    print_status "info" "Testing Checkov scan on infrastructure directory..."

    # Create temporary output file for testing
    TEMP_SARIF="/tmp/checkov-test-$(date +%s).sarif"

    if checkov -d infrastructure/ \
               --framework terraform \
               --output sarif \
               --output-file-path "$TEMP_SARIF" \
               --quiet \
               --soft-fail 2>/dev/null; then

        if [ -f "$TEMP_SARIF" ]; then
            print_status "success" "Checkov scan completed successfully"

            # Validate SARIF structure
            if jq empty "$TEMP_SARIF" 2>/dev/null; then
                print_status "success" "Generated SARIF file has valid JSON structure"

                # Extract metrics
                RESULT_COUNT=$(jq '.runs[0].results | length' "$TEMP_SARIF" 2>/dev/null || echo "0")
                RULE_COUNT=$(jq '.runs[0].tool.driver.rules | length' "$TEMP_SARIF" 2>/dev/null || echo "0")

                echo "📊 Test Scan Results:"
                echo "  - Security rules checked: $RULE_COUNT"
                echo "  - Security findings: $RESULT_COUNT"

                # Clean up
                rm -f "$TEMP_SARIF"
            else
                print_status "warning" "SARIF file generated but has invalid JSON structure"
                rm -f "$TEMP_SARIF"
            fi
        else
            print_status "error" "Checkov ran but did not generate SARIF file"
        fi
    else
        print_status "error" "Checkov scan failed"
        rm -f "$TEMP_SARIF"
    fi

else
    print_status "warning" "Checkov not available locally"
    print_status "info" "This is normal - Checkov will be available in CI/CD environment"
fi

# Validate workflow configuration
echo ""
print_status "info" "Validating GitHub Actions workflow configuration..."

WORKFLOW_FILE=".github/workflows/infrastructure.yml"

if [ -f "$WORKFLOW_FILE" ]; then
    print_status "success" "Workflow file exists: $WORKFLOW_FILE"

    # Check for required Checkov configuration
    if grep -q "bridgecrewio/checkov-action" "$WORKFLOW_FILE"; then
        print_status "success" "Checkov action is properly configured"
    else
        print_status "error" "Checkov action not found in workflow"
    fi

    # Check for SARIF upload
    if grep -q "github/codeql-action/upload-sarif" "$WORKFLOW_FILE"; then
        print_status "success" "SARIF upload is configured"
    else
        print_status "error" "SARIF upload not configured"
    fi

    # Check for proper directory configuration (no ./ prefix)
    if grep -q "directory: infrastructure/" "$WORKFLOW_FILE" && ! grep -q "directory: ./infrastructure/" "$WORKFLOW_FILE"; then
        print_status "success" "Directory path is correctly configured (no ./ prefix)"
    else
        print_status "error" "Directory path may have incorrect ./ prefix"
    fi

else
    print_status "error" "Workflow file not found: $WORKFLOW_FILE"
fi

# Summary
echo ""
echo "=================================================="
print_status "info" "Configuration validation complete"
echo ""
print_status "info" "Next Steps:"
echo "  1. Commit and push these changes"
echo "  2. Trigger the 'Infrastructure Validation' workflow"
echo "  3. Monitor the 'Terraform Security Validation' job"
echo "  4. Check Security tab for scan results"
echo ""
print_status "info" "For issues, check:"
echo "  - GitHub Actions logs for detailed error messages"
echo "  - Security tab for SARIF upload status"
echo "  - infrastructure/ directory for Terraform files"
echo "=================================================="

print_status "success" "FinTech DevOps validation complete"
