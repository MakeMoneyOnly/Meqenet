@echo off
REM Meqenet Development Tools Setup Script
REM Installs missing tools for complete OWASP scanning

echo 🚀 Meqenet Development Tools Setup
echo ===================================

echo Checking for Go...
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Go...
    winget install -e --id GoLang.Go
) else (
    echo ✅ Go is already installed
)

echo.
echo Checking for Ruby...
where ruby >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Ruby...
    winget install -e --id RubyInstallerTeam.Ruby
) else (
    echo ✅ Ruby is already installed
)

echo.
echo Checking for Gradle...
where gradle >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Gradle...
    winget install -e --id Gradle.Gradle
) else (
    echo ✅ Gradle is already installed
)

echo.
echo Setup complete! Please restart your terminal for PATH changes to take effect.
echo You can now run: pnpm run security:owasp
pause
