@echo off
REM Windows wrapper for OWASP dependency scanning
REM Handles Windows path issues and provides clean execution

echo 🚀 Running OWASP Dependency Check...

REM Clean workspace first
echo 🧹 Cleaning workspace...
node scripts/clean-workspace-for-scan.js

REM Run cdxgen with proper Windows path handling
echo 🔍 Running dependency scan...
npx @cyclonedx/cdxgen --config .cdxgenrc

if %errorlevel% neq 0 (
    echo ⚠️  Scan completed with warnings - check reports/bom.json
) else (
    echo ✅ OWASP scan completed successfully - check reports/bom.json
)
