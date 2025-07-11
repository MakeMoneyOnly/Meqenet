#!/bin/bash
# Meqenet.et Pre-Push Validation Script
# Runs comprehensive local CI/CD validation before pushing to remote

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Banner
echo -e "${BLUE}🏦 MEQENET.ET PRE-PUSH VALIDATION${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "governance" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Parse command line arguments
QUICK=false
SECURITY_ONLY=false
AUTO_FIX=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK=true
            shift
            ;;
        --security-only)
            SECURITY_ONLY=true
            shift
            ;;
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --quick         Run only essential checks (faster)"
            echo "  --security-only Run only security-related checks"
            echo "  --auto-fix      Automatically fix formatting and linting issues"
            echo "  --skip-tests    Skip test execution (not recommended)"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Full validation"
            echo "  $0 --quick           # Quick validation"
            echo "  $0 --auto-fix        # Fix issues and validate"
            echo "  $0 --security-only   # Security checks only"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to run command with error handling
run_command() {
    local cmd="$1"
    local description="$2"
    
    print_status "$description..."
    if eval "$cmd"; then
        print_success "$description completed"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Start validation
start_time=$(date +%s)

print_status "Starting pre-push validation..."
echo ""

# Step 1: Environment setup
print_status "🔧 Checking environment setup..."

# Check for required tools
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

if ! command -v python &> /dev/null; then
    print_error "Python is not installed. Please install Python first."
    exit 1
fi

print_success "Environment setup verified"
echo ""

# Step 2: Install dependencies (if needed)
if [ ! -d "node_modules" ] || [ ! -f "pnpm-lock.yaml" ]; then
    print_status "📦 Installing dependencies..."
    if ! pnpm install; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed"
    echo ""
fi

# Step 3: Auto-fix issues (if requested)
if [ "$AUTO_FIX" = true ]; then
    print_status "🔧 Auto-fixing code issues..."
    
    # Format code
    run_command "pnpm run format:write" "Code formatting"
    
    # Fix linting issues
    run_command "pnpm run lint --fix" "Linting auto-fixes"
    
    echo ""
fi

# Step 4: Quick validation path
if [ "$QUICK" = true ]; then
    print_status "🚀 Running QUICK validation (essential checks only)..."
    
    run_command "pnpm run format:check" "Code formatting check"
    run_command "pnpm run lint" "ESLint validation"
    run_command "pnpm audit --audit-level moderate" "Security audit"
    
    if [ "$SKIP_TESTS" = false ]; then
        run_command "pnpm test --run" "Unit tests"
    fi
    
elif [ "$SECURITY_ONLY" = true ]; then
    print_status "🔒 Running SECURITY-ONLY validation..."
    
    run_command "pnpm audit --audit-level moderate" "Dependency security audit"
    run_command "python tools/git/git-automation.py security-scan" "Advanced security scanning"
    run_command "python tools/git/git-automation.py validate-environment" "Environment security validation"
    
else
    # Full validation using our comprehensive validator
    print_status "🏁 Running COMPREHENSIVE validation..."
    
    if [ -f "governance/local_ci_validator.py" ]; then
        # Use our comprehensive validator
        run_command "python governance/local_ci_validator.py --parallel" "Comprehensive CI/CD validation"
    else
        # Fallback to individual checks
        print_warning "Comprehensive validator not found, running individual checks..."
        
        run_command "pnpm run format:check" "Code formatting check"
        run_command "pnpm run lint" "ESLint validation"
        run_command "pnpm run build" "TypeScript compilation"
        run_command "pnpm audit --audit-level moderate" "Security audit"
        
        if [ "$SKIP_TESTS" = false ]; then
            run_command "pnpm test --run" "Test suite"
        fi
        
        run_command "python tools/git/git-automation.py security-scan" "Security scanning"
        run_command "python tools/git/git-automation.py validate-environment" "Environment validation"
    fi
fi

# Calculate duration
end_time=$(date +%s)
duration=$((end_time - start_time))

# Final summary
echo ""
echo -e "${BLUE}📋 VALIDATION SUMMARY${NC}"
echo -e "${BLUE}====================${NC}"
print_success "All validations passed! ✨"
print_status "Total duration: ${duration} seconds"
echo ""
print_success "🚀 Ready to push to remote repository!"
echo ""

# Helpful next steps
echo -e "${BLUE}💡 Suggested next steps:${NC}"
echo "   git add -A"
echo "   git commit -m \"your commit message\""
echo "   git push origin your-branch"
echo ""

# Optional: Show git status
if command -v git &> /dev/null; then
    echo -e "${BLUE}📄 Current git status:${NC}"
    git status --short
fi

exit 0 