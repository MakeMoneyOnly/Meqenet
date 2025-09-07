@echo off
REM Meqenet.et Git Command Wrapper (Windows)
REM Enterprise-Grade Git Security Gate
REM Prevents dangerous operations that bypass security controls

setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "VALIDATOR_SCRIPT=%SCRIPT_DIR%git-command-validator.js"

REM Function to validate git command
:validate_command
set "args=%*"
set "command_line=%args: =_%"

REM Check for blocked flags
echo %args% | findstr /i /c:"--no-verify" >nul 2>&1
if %errorlevel% equ 0 goto :security_violation

echo %args% | findstr /i /c:"--no-verify-signatures" >nul 2>&1
if %errorlevel% equ 0 goto :security_violation

echo %args% | findstr /i /c:"--allow-empty" >nul 2>&1
if %errorlevel% equ 0 goto :security_violation

echo %args% | findstr /i /c:"--force-with-lease" >nul 2>&1
if %errorlevel% equ 0 goto :security_violation

echo %args% | findstr /i /c:"--force" >nul 2>&1
if %errorlevel% equ 0 goto :security_violation

REM Check for destructive patterns
echo %args% | findstr /i /r /c:"reset.*--hard" >nul 2>&1
if %errorlevel% equ 0 goto :destructive_operation

echo %args% | findstr /i /r /c:"push.*--force" >nul 2>&1
if %errorlevel% equ 0 goto :destructive_operation

echo %args% | findstr /i /r /c:"push.*-f" >nul 2>&1
if %errorlevel% equ 0 goto :destructive_operation

echo %args% | findstr /i /r /c:"clean.*-fd" >nul 2>&1
if %errorlevel% equ 0 goto :destructive_operation

echo %args% | findstr /i /r /c:"clean.*--force" >nul 2>&1
if %errorlevel% equ 0 goto :destructive_operation

goto :execute_command

:security_violation
echo.
echo ================================================================================
echo 🚨 SECURITY VIOLATION: --no-verify or dangerous flag detected!
echo.
echo ❌ FORBIDDEN: Using bypass flags violates enterprise security controls
echo 🔒 This breaks Ethiopian FinTech regulatory compliance requirements
echo.
echo 📋 BLOCKED FLAGS:
echo    • --no-verify
echo    • --no-verify-signatures
echo    • --allow-empty
echo    • --force-with-lease
echo    • --force
echo.
echo ✅ REQUIRED: All git operations must pass enterprise security validation
echo 🏛️ Contact security team: security@meqenet.et
echo.
echo 🇪🇹 Ethiopian FinTech Security Compliance Enforced
echo ================================================================================
exit /b 1

:destructive_operation
echo.
echo ================================================================================
echo 🚨 DESTRUCTIVE OPERATION DETECTED!
echo.
echo ❌ FORBIDDEN: Command permanently destroys work and violates audit requirements
echo 💀 This breaks enterprise development standards
echo.
echo 📋 BLOCKED PATTERNS:
echo    • git reset --hard
echo    • git push --force
echo    • git clean -fd
echo    • git clean --force
echo.
echo ✅ REQUIRED: Use safe alternatives that preserve work history
echo 🔄 Safe alternatives: git reset --soft, git stash, git branch
echo 🏛️ Contact development team for destructive operations: dev@meqenet.et
echo.
echo 🇪🇹 Ethiopian FinTech Development Standards Enforced
echo ================================================================================
exit /b 1

:execute_command
REM Execute the validated git command
git %*
goto :eof

REM Main execution
:main
if "%~1"=="" (
    echo Meqenet.et Git Command Wrapper v1.0.0
    echo Enterprise-Grade Git Security Gate
    echo Usage: git ^<command^> [options]
    goto :eof
)

call :validate_command %*
goto :eof
