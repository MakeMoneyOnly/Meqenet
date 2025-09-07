@echo off
REM Meqenet.et Git Security Setup Script (Windows)
REM Enterprise-Grade Git Command Security Gate Configuration

setlocal enabledelayedexpansion

REM Colors (if supported)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

REM Function to print colored output (fallback to plain text)
:print_status
echo ✅ %~1
goto :eof

:print_warning
echo ⚠️  %~1
goto :eof

:print_error
echo ❌ %~1
goto :eof

:print_info
echo ℹ️  %~1
goto :eof

REM Function to setup git alias
:setup_git_alias
set "SCRIPT_DIR=%~dp0"
set "WRAPPER_SCRIPT=%SCRIPT_DIR%git-wrapper.bat"

call :print_info "Setting up Git security wrapper..."

REM Check if wrapper script exists
if not exist "%WRAPPER_SCRIPT%" (
    call :print_error "Git wrapper script not found: %WRAPPER_SCRIPT%"
    exit /b 1
)

REM Create git alias
git config --global alias.secure "!%WRAPPER_SCRIPT%"

call :print_status "Git security alias configured: git secure"
call :print_info "Usage: git secure ^<command^> [options]"
call :print_info "Example: git secure commit -m 'feat: add new feature'"
goto :eof

REM Function to test the setup
:test_setup
call :print_info "Testing Git security wrapper..."

REM Test blocked flag
call :print_info "Testing --no-verify flag blocking..."
git secure commit --no-verify -m "test" >nul 2>&1
if %errorlevel% equ 0 (
    call :print_error "Security test failed: --no-verify flag was not blocked"
    exit /b 1
) else (
    call :print_status "--no-verify flag properly blocked"
)

REM Test destructive command
call :print_info "Testing destructive command blocking..."
git secure reset --hard HEAD~1 >nul 2>&1
if %errorlevel% equ 0 (
    call :print_error "Security test failed: destructive command was not blocked"
    exit /b 1
) else (
    call :print_status "Destructive command properly blocked"
)

REM Test allowed command
call :print_info "Testing allowed command..."
git secure status >nul 2>&1
if %errorlevel% equ 0 (
    call :print_status "Allowed commands work properly"
) else (
    call :print_warning "Allowed command test failed, but this may be due to git state"
)
goto :eof

REM Function to show usage
:show_usage
echo Meqenet.et Git Security Setup Script
echo Enterprise-Grade Git Command Security Gate
echo.
echo Usage:
echo   %0 [options]
echo.
echo Options:
echo   --setup     Setup git security wrapper (default)
echo   --test      Test the security wrapper
echo   --help      Show this help message
echo.
echo Examples:
echo   %0              # Setup git security wrapper
echo   %0 --test       # Test the security wrapper
echo   %0 --help       # Show help
echo.
echo After setup, use 'git secure ^<command^>' instead of 'git ^<command^>'
echo for enterprise-grade security validation.
goto :eof

REM Main execution
:main
set "action=setup"

REM Parse command line arguments
if "%~1"=="--setup" (
    set "action=setup"
    shift
) else if "%~1"=="--test" (
    set "action=test"
    shift
) else if "%~1"=="--help" (
    call :show_usage
    goto :eof
) else if "%~1"=="" (
    REM Default action
) else (
    call :print_error "Unknown option: %~1"
    call :show_usage
    exit /b 1
)

echo 🚀 Meqenet.et Git Security Setup
echo ===============================
echo.

if "%action%"=="setup" (
    call :setup_git_alias
    echo.
    call :print_info "🎉 Git security setup completed!"
    call :print_info "Use 'git secure ^<command^>' for validated git operations"
    call :print_info "Example: git secure commit -m 'feat: add feature'"
) else if "%action%"=="test" (
    call :test_setup
    echo.
    call :print_info "🎉 Git security tests completed!"
)

echo.
call :print_info "🇪🇹 Ethiopian FinTech Security Compliance Enforced"
goto :eof

REM Execute main function
call :main %*
