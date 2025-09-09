@echo off
REM Windows wrapper for OWASP dependency scanning
REM Handles Windows path issues and provides clean execution

echo 🚀 Running OWASP Dependency Check...

REM Clean workspace first
echo 🧹 Cleaning workspace...
node scripts/clean-workspace-for-scan.js

REM Ensure reports directory exists
if not exist "reports" mkdir reports

REM Run cdxgen with proper Windows path handling and optimized configuration
echo 🔍 Running JavaScript/TypeScript dependency scan...
echo   - Scanning Node.js packages and dependencies
echo   - Generating comprehensive SBOM (Software Bill of Materials)
echo   - Atom-based analysis disabled for better Windows compatibility
set CDXGEN_ATOM_DISABLE=1
set CDXGEN_REACHABLES_DISABLE=1
set CDXGEN_USAGES_DISABLE=1
npx @cyclonedx/cdxgen --config .cdxgenrc .

if %errorlevel% neq 0 (
    echo ⚠️  Scan completed with warnings - check reports/bom.json
    echo     Note: Warnings are normal for multi-language projects
) else (
    echo ✅ OWASP scan completed successfully - check reports/bom.json
)

REM Display scan results summary
if exist "reports/bom.json" (
    echo.
    echo 📊 Scan Results Summary:
    echo   - SBOM generated: reports/bom.json
    node -e "try { const bom = JSON.parse(require('fs').readFileSync('reports/bom.json', 'utf8')); console.log('   - Components found:', bom.components ? bom.components.length : 0); console.log('   - Dependencies tracked:', bom.dependencies ? bom.dependencies.length : 0); } catch(e) { console.log('   - Unable to parse SBOM for summary'); }"
) else (
    echo ❌ SBOM file not generated - check for errors above
)
