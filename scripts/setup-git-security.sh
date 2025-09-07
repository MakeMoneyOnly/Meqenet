#!/bin/bash

# Meqenet.et Git Security Setup Script
# Enterprise-Grade Git Command Security Gate Configuration
# Prevents dangerous operations that bypass security controls

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="macos";;
        CYGWIN*)    OS="windows";;
        MINGW*)     OS="windows";;
        MSYS*)      OS="windows";;
        *)          OS="unknown";;
    esac

    if [ "$OS" = "windows" ] && [ -n "$WINDIR" ]; then
        OS="windows-native"
    fi
}

# Function to setup git alias
setup_git_alias() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local wrapper_script=""

    print_info "Setting up Git security wrapper..."

    # Detect OS and choose appropriate wrapper
    detect_os

    case $OS in
        "linux"|"macos")
            wrapper_script="$script_dir/git-wrapper.sh"
            if [ ! -x "$wrapper_script" ]; then
                print_error "Git wrapper script not found or not executable: $wrapper_script"
                exit 1
            fi
            ;;
        "windows"|"windows-native")
            wrapper_script="$script_dir/git-wrapper.bat"
            if [ ! -f "$wrapper_script" ]; then
                print_error "Git wrapper script not found: $wrapper_script"
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac

    # Create git alias
    if git config --global alias.secure 2>/dev/null; then
        print_warning "Git alias 'secure' already exists. Updating..."
    fi

    # Use absolute path for the wrapper script
    git config --global alias.secure "!$wrapper_script"

    print_status "Git security alias configured: git secure"
    print_info "Usage: git secure <command> [options]"
    print_info "Example: git secure commit -m 'feat: add new feature'"
}

# Function to test the setup
test_setup() {
    print_info "Testing Git security wrapper..."

    # Test blocked flag
    print_info "Testing --no-verify flag blocking..."
    if git secure commit --no-verify -m "test" 2>/dev/null; then
        print_error "Security test failed: --no-verify flag was not blocked"
        exit 1
    else
        print_status "--no-verify flag properly blocked"
    fi

    # Test destructive command
    print_info "Testing destructive command blocking..."
    if git secure reset --hard HEAD~1 2>/dev/null; then
        print_error "Security test failed: destructive command was not blocked"
        exit 1
    else
        print_status "Destructive command properly blocked"
    fi

    # Test allowed command
    print_info "Testing allowed command..."
    if git secure status >/dev/null 2>&1; then
        print_status "Allowed commands work properly"
    else
        print_warning "Allowed command test failed, but this may be due to git state"
    fi
}

# Function to show usage information
show_usage() {
    echo "Meqenet.et Git Security Setup Script"
    echo "Enterprise-Grade Git Command Security Gate"
    echo ""
    echo "Usage:"
    echo "  $0 [options]"
    echo ""
    echo "Options:"
    echo "  --setup     Setup git security wrapper (default)"
    echo "  --test      Test the security wrapper"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Setup git security wrapper"
    echo "  $0 --test            # Test the security wrapper"
    echo "  $0 --help            # Show help"
    echo ""
    echo "After setup, use 'git secure <command>' instead of 'git <command>'"
    echo "for enterprise-grade security validation."
}

# Main execution
main() {
    local action="setup"

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --setup)
                action="setup"
                shift
                ;;
            --test)
                action="test"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    echo "🚀 Meqenet.et Git Security Setup"
    echo "==============================="

    case $action in
        "setup")
            setup_git_alias
            print_info ""
            print_info "🎉 Git security setup completed!"
            print_info "Use 'git secure <command>' for validated git operations"
            print_info "Example: git secure commit -m 'feat: add feature'"
            ;;
        "test")
            test_setup
            print_info ""
            print_info "🎉 Git security tests completed!"
            ;;
    esac

    echo ""
    print_info "🇪🇹 Ethiopian FinTech Security Compliance Enforced"
}

# Execute main function
main "$@"
