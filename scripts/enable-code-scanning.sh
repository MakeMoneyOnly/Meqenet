#!/bin/bash

# 🔒 Code Scanning Enablement Script for Meqenet FinTech Platform
# Enterprise-grade script to enable and verify GitHub Code Scanning
# Version: 1.0
# Author: FinTech DevOps Engineer
# Compliance: NBE Directives, PCI DSS

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_VERSION="1.0"
REQUIRED_NODE_VERSION="22"
REQUIRED_PNPM_VERSION="10"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display header
show_header() {
    echo "=================================================="
    echo "🔒 Meqenet Code Scanning Enablement Script v${SCRIPT_VERSION}"
    echo "=================================================="
    echo "Enterprise-grade security configuration for FinTech"
    echo "Compliance: NBE Directives, PCI DSS, ISO 27001"
    echo "=================================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if running on supported OS
    if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "Unsupported OS: $OSTYPE"
        log_error "This script requires Linux or macOS"
        exit 1
    fi

    # Check for required tools
    local tools=("curl" "jq" "git")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            log_error "Please install $tool and try again"
            exit 1
        fi
    done

    log_success "Prerequisites check completed"
}

# Check GitHub CLI authentication
check_github_auth() {
    log_info "Checking GitHub CLI authentication..."

    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI not found"
        log_info "Please install GitHub CLI from: https://cli.github.com/"
        log_info "Or authenticate manually in GitHub web interface"
        return 1
    fi

    if ! gh auth status &> /dev/null; then
        log_warning "GitHub CLI not authenticated"
        log_info "Please run: gh auth login"
        log_info "Or authenticate manually in GitHub web interface"
        return 1
    fi

    log_success "GitHub CLI authentication verified"
    return 0
}

# Get repository information
get_repo_info() {
    log_info "Detecting repository information..."

    # Try to get repo info from git remote
    if git remote get-url origin &> /dev/null; then
        REPO_URL=$(git remote get-url origin)
        if [[ $REPO_URL == https://github.com/* ]]; then
            REPO_NAME=$(basename "$REPO_URL" .git)
            ORG_NAME=$(basename "$(dirname "$REPO_URL")")
        elif [[ $REPO_URL == git@github.com:* ]]; then
            REPO_INFO=$(echo "$REPO_URL" | sed 's/git@github.com://' | sed 's/.git$//')
            ORG_NAME=$(echo "$REPO_INFO" | cut -d'/' -f1)
            REPO_NAME=$(echo "$REPO_INFO" | cut -d'/' -f2)
        else
            log_error "Unsupported Git remote URL format: $REPO_URL"
            exit 1
        fi
    else
        log_error "Not in a Git repository or no remote origin found"
        exit 1
    fi

    FULL_REPO_NAME="${ORG_NAME}/${REPO_NAME}"

    log_success "Repository detected: $FULL_REPO_NAME"
}

# Check current code scanning status
check_code_scanning_status() {
    log_info "Checking current Code Scanning status..."

    if ! check_github_auth; then
        log_warning "Cannot verify code scanning status without GitHub CLI"
        log_info "Please check manually in GitHub web interface:"
        log_info "Repository Settings → Security → Code security and analysis"
        return 1
    fi

    # Check if code scanning is enabled
    if gh api "repos/${FULL_REPO_NAME}/code-scanning/alerts" --paginate --jq 'length' &> /dev/null; then
        log_success "✅ Code scanning is ENABLED"
        return 0
    else
        log_warning "❌ Code scanning is NOT ENABLED"
        return 1
    fi
}

# Enable code scanning via GitHub CLI
enable_code_scanning() {
    log_info "Enabling Code Scanning..."

    if ! check_github_auth; then
        log_error "GitHub CLI authentication required to enable code scanning"
        log_info "Please run: gh auth login"
        log_info "Or enable manually in GitHub web interface"
        return 1
    fi

    # Enable code scanning alerts
    log_info "Enabling code scanning alerts..."
    if gh api -X PATCH "repos/${FULL_REPO_NAME}" \
        -H "Accept: application/vnd.github+json" \
        -f "security_and_analysis[advanced_security][status]=enabled" \
        -f "security_and_analysis[secret_scanning][status]=enabled" \
        -f "security_and_analysis[secret_scanning_push_protection][status]=enabled" \
        &> /dev/null; then
        log_success "✅ Code scanning enabled successfully"
    else
        log_error "Failed to enable code scanning"
        return 1
    fi

    # Wait a moment for changes to take effect
    log_info "Waiting for configuration to take effect..."
    sleep 5

    # Verify the changes
    if check_code_scanning_status; then
        log_success "🎉 Code scanning successfully enabled and verified!"
        return 0
    else
        log_warning "Code scanning may take a few minutes to activate"
        log_info "Please check again in a few minutes"
        return 1
    fi
}

# Display manual enablement instructions
show_manual_instructions() {
    echo ""
    echo "=================================================="
    echo "📋 MANUAL CODE SCANNING ENABLEMENT INSTRUCTIONS"
    echo "=================================================="
    echo ""
    echo "If automatic enablement failed, follow these steps:"
    echo ""
    echo "1. 🌐 Open GitHub in your web browser"
    echo "2. 📂 Navigate to your repository: https://github.com/${FULL_REPO_NAME}"
    echo "3. ⚙️  Click 'Settings' tab"
    echo "4. 🔒 Click 'Security' in the left sidebar"
    echo "5. 🛡️  Click 'Code security and analysis'"
    echo "6. ✅ Enable the following features:"
    echo "   • Code scanning alerts"
    echo "   • Dependabot alerts"
    echo "   • Dependabot security updates"
    echo "7. 💾 Click 'Save' to apply changes"
    echo ""
    echo "=================================================="
}

# Verify workflow configuration
verify_workflow_config() {
    log_info "Verifying CodeQL workflow configuration..."

    local workflow_file=".github/workflows/codeql.yml"

    if [[ ! -f "$workflow_file" ]]; then
        log_error "CodeQL workflow file not found: $workflow_file"
        return 1
    fi

    # Check if workflow has required permissions
    if grep -q "security-events: write" "$workflow_file"; then
        log_success "✅ Workflow has security-events write permission"
    else
        log_warning "⚠️  Workflow may be missing security-events write permission"
    fi

    # Check if workflow uses CodeQL
    if grep -q "github/codeql-action" "$workflow_file"; then
        log_success "✅ Workflow uses CodeQL action"
    else
        log_error "❌ Workflow does not use CodeQL action"
        return 1
    fi

    log_success "Workflow configuration verified"
}

# Run post-enablement tests
run_post_tests() {
    log_info "Running post-enablement verification..."

    # Check if repository has any commits
    if git rev-parse HEAD &> /dev/null; then
        log_success "✅ Repository has commits"
    else
        log_warning "⚠️  Repository has no commits"
    fi

    # Check if workflow files exist
    local workflow_files=(
        ".github/workflows/codeql.yml"
        ".github/codeql/codeql-config.yml"
    )

    for file in "${workflow_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "✅ $file exists"
        else
            log_warning "⚠️  $file not found"
        fi
    done

    # Verify Node.js and pnpm versions in workflow
    if grep -q "node-version: ${{ env.NODE_VERSION }}" .github/workflows/codeql.yml 2>/dev/null; then
        log_success "✅ Workflow uses environment variables for versions"
    else
        log_info "ℹ️  Workflow uses hardcoded versions (consider using env vars)"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "=================================================="
    echo "🎯 NEXT STEPS AFTER ENABLING CODE SCANNING"
    echo "=================================================="
    echo ""
    echo "1. 🔄 Trigger CodeQL workflow:"
    echo "   • Push a commit to main/develop branch"
    echo "   • Or manually trigger from Actions tab"
    echo ""
    echo "2. 📊 Monitor results:"
    echo "   • Check Security → Code scanning alerts"
    echo "   • Review workflow runs in Actions tab"
    echo ""
    echo "3. 🔧 Address findings:"
    echo "   • Review critical/high severity issues"
    echo "   • Implement security fixes"
    echo "   • Update compliance documentation"
    echo ""
    echo "4. 📈 Set up monitoring:"
    echo "   • Configure alerts for new findings"
    echo "   • Schedule regular security reviews"
    echo "   • Track remediation progress"
    echo ""
    echo "=================================================="
}

# Main execution
main() {
    show_header
    check_prerequisites
    get_repo_info

    echo ""
    log_info "Starting Code Scanning enablement process..."

    # Check current status
    if check_code_scanning_status; then
        log_success "Code scanning is already enabled!"
        verify_workflow_config
        run_post_tests
        show_next_steps
        exit 0
    fi

    echo ""
    log_info "Attempting to enable Code Scanning..."

    # Try to enable automatically
    if enable_code_scanning; then
        log_success "🎉 Code Scanning enabled successfully!"
    else
        log_warning "Automatic enablement failed"
        show_manual_instructions
    fi

    # Run verification steps
    verify_workflow_config
    run_post_tests
    show_next_steps

    echo ""
    log_success "Code Scanning setup process completed!"
    log_info "For detailed documentation, see: docs/CICD_SECURITY_CODEQL_IMPLEMENTATION.md"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Enable Code Scanning for Meqenet FinTech repository"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --version, -v       Show version information"
        echo "  --check-only        Only check current status, don't enable"
        echo "  --manual-only       Only show manual instructions"
        echo ""
        exit 0
        ;;
    --version|-v)
        echo "Meqenet Code Scanning Script v${SCRIPT_VERSION}"
        exit 0
        ;;
    --check-only)
        show_header
        check_prerequisites
        get_repo_info
        check_code_scanning_status
        verify_workflow_config
        exit 0
        ;;
    --manual-only)
        show_header
        get_repo_info
        show_manual_instructions
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
