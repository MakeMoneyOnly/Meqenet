@echo off
setlocal enabledelayedexpansion

REM Meqenet.et Pre-Push Validation Script for Windows
REM Runs comprehensive local CI/CD validation before pushing to remote

echo.
echo 🏦 MEQENET.ET PRE-PUSH VALIDATION
echo ===================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)

if not exist "governance\" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)

REM Parse command line arguments
set QUICK=false
set SECURITY_ONLY=false
set AUTO_FIX=false
set SKIP_TESTS=false

:parse_args
if "%1"=="--quick" (
    set QUICK=true
    shift
    goto parse_args
)
if "%1"=="--security-only" (
    set SECURITY_ONLY=true
    shift
    goto parse_args
)
if "%1"=="--auto-fix" (
    set AUTO_FIX=true
    shift
    goto parse_args
)
if "%1"=="--skip-tests" (
    set SKIP_TESTS=true
    shift
    goto parse_args
)
if "%1"=="--help" (
    echo Usage: %0 [OPTIONS]
    echo.
    echo Options:
    echo   --quick         Run only essential checks (faster^)
    echo   --security-only Run only security-related checks
    echo   --auto-fix      Automatically fix formatting and linting issues
    echo   --skip-tests    Skip test execution (not recommended^)
    echo   --help          Show this help message
    echo.
    echo Examples:
    echo   %0                    # Full validation
    echo   %0 --quick           # Quick validation
    echo   %0 --auto-fix        # Fix issues and validate
    echo   %0 --security-only   # Security checks only
    exit /b 0
)
if not "%1"=="" (
    echo [ERROR] Unknown option: %1
    echo Use --help for usage information
    exit /b 1
)

REM Start validation
echo [INFO] Starting pre-push validation...
echo.

REM Step 1: Environment setup
echo [INFO] 🔧 Checking environment setup...

REM Check for required tools
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm is not installed. Please install pnpm first.
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python first.
    exit /b 1
)

echo [SUCCESS] Environment setup verified
echo.

REM Step 2: Install dependencies (if needed)
if not exist "node_modules\" (
    echo [INFO] 📦 Installing dependencies...
    call pnpm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
    echo.
)

REM Step 3: Auto-fix issues (if requested)
if "%AUTO_FIX%"=="true" (
    echo [INFO] 🔧 Auto-fixing code issues...
    
    echo [INFO] Code formatting...
    call pnpm run format:write
    if errorlevel 1 (
        echo [ERROR] Code formatting failed
        exit /b 1
    )
    echo [SUCCESS] Code formatting completed
    
    echo [INFO] Linting auto-fixes...
    call pnpm run lint --fix
    if errorlevel 1 (
        echo [ERROR] Linting auto-fixes failed
        exit /b 1
    )
    echo [SUCCESS] Linting auto-fixes completed
    
    echo.
)

REM Step 4: Validation based on mode
if "%QUICK%"=="true" (
    echo [INFO] 🚀 Running QUICK validation (essential checks only^)...
    
    echo [INFO] Code formatting check...
    call pnpm run format:check
    if errorlevel 1 (
        echo [ERROR] Code formatting check failed
        exit /b 1
    )
    echo [SUCCESS] Code formatting check completed
    
    echo [INFO] ESLint validation...
    call pnpm run lint
    if errorlevel 1 (
        echo [ERROR] ESLint validation failed
        exit /b 1
    )
    echo [SUCCESS] ESLint validation completed
    
    echo [INFO] Security audit...
    call pnpm audit --audit-level moderate
    if errorlevel 1 (
        echo [ERROR] Security audit failed
        exit /b 1
    )
    echo [SUCCESS] Security audit completed
    
    if "%SKIP_TESTS%"=="false" (
        echo [INFO] Unit tests...
        call pnpm test --run
        if errorlevel 1 (
            echo [ERROR] Unit tests failed
            exit /b 1
        )
        echo [SUCCESS] Unit tests completed
    )
    
) else if "%SECURITY_ONLY%"=="true" (
    echo [INFO] 🔒 Running SECURITY-ONLY validation...
    
    echo [INFO] Dependency security audit...
    call pnpm audit --audit-level moderate
    if errorlevel 1 (
        echo [ERROR] Dependency security audit failed
        exit /b 1
    )
    echo [SUCCESS] Dependency security audit completed
    
    echo [INFO] Advanced security scanning...
    call python tools\git\git-automation.py security-scan
    if errorlevel 1 (
        echo [ERROR] Advanced security scanning failed
        exit /b 1
    )
    echo [SUCCESS] Advanced security scanning completed
    
    echo [INFO] Environment security validation...
    call python tools\git\git-automation.py validate-environment
    if errorlevel 1 (
        echo [ERROR] Environment security validation failed
        exit /b 1
    )
    echo [SUCCESS] Environment security validation completed
    
) else (
    REM Full validation
    echo [INFO] 🏁 Running COMPREHENSIVE validation...
    
    if exist "governance\local_ci_validator.py" (
        echo [INFO] Comprehensive CI/CD validation...
        call python governance\local_ci_validator.py --parallel
        if errorlevel 1 (
            echo [ERROR] Comprehensive CI/CD validation failed
            exit /b 1
        )
        echo [SUCCESS] Comprehensive CI/CD validation completed
    ) else (
        echo [WARNING] Comprehensive validator not found, running individual checks...
        
        echo [INFO] Code formatting check...
        call pnpm run format:check
        if errorlevel 1 (
            echo [ERROR] Code formatting check failed
            exit /b 1
        )
        echo [SUCCESS] Code formatting check completed
        
        echo [INFO] ESLint validation...
        call pnpm run lint
        if errorlevel 1 (
            echo [ERROR] ESLint validation failed
            exit /b 1
        )
        echo [SUCCESS] ESLint validation completed
        
        echo [INFO] TypeScript compilation...
        call pnpm run build
        if errorlevel 1 (
            echo [ERROR] TypeScript compilation failed
            exit /b 1
        )
        echo [SUCCESS] TypeScript compilation completed
        
        echo [INFO] Security audit...
        call pnpm audit --audit-level moderate
        if errorlevel 1 (
            echo [ERROR] Security audit failed
            exit /b 1
        )
        echo [SUCCESS] Security audit completed
        
        if "%SKIP_TESTS%"=="false" (
            echo [INFO] Test suite...
            call pnpm test --run
            if errorlevel 1 (
                echo [ERROR] Test suite failed
                exit /b 1
            )
            echo [SUCCESS] Test suite completed
        )
        
        echo [INFO] Security scanning...
        call python tools\git\git-automation.py security-scan
        if errorlevel 1 (
            echo [ERROR] Security scanning failed
            exit /b 1
        )
        echo [SUCCESS] Security scanning completed
        
        echo [INFO] Environment validation...
        call python tools\git\git-automation.py validate-environment
        if errorlevel 1 (
            echo [ERROR] Environment validation failed
            exit /b 1
        )
        echo [SUCCESS] Environment validation completed
    )
)

REM Final summary
echo.
echo 📋 VALIDATION SUMMARY
echo ====================
echo [SUCCESS] All validations passed! ✨
echo.
echo [SUCCESS] 🚀 Ready to push to remote repository!
echo.

REM Helpful next steps
echo 💡 Suggested next steps:
echo    git add -A
echo    git commit -m "your commit message"
echo    git push origin your-branch
echo.

REM Optional: Show git status
where git >nul 2>&1
if not errorlevel 1 (
    echo 📄 Current git status:
    git status --short
)

exit /b 0 