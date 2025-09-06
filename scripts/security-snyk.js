#!/usr/bin/env node
/**
 * 🚀 Enterprise-grade Snyk Scan Runner
 * - Uses local/trusted Snyk binaries when available
 * - Works across PowerShell, cmd, Bash, CI/CD
 * - Enforces consistent JSON output
 * - Fails fast if vulnerabilities are found
 * - Creates report directories safely
 * - Provides clear Windows troubleshooting guidance
 */

import { execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = resolve(__dirname, '../reports');
const reportFile = resolve(reportsDir, 'snyk-results.json');

// Check for system-wide Snyk installation (most trusted)
const systemSnykPath =
  'C:\\ProgramData\\chocolatey\\lib\\snyk\\tools\\snyk.exe';

function getSnykCommand() {
  // Prefer system-wide Chocolatey installation (most trusted)
  if (existsSync(systemSnykPath)) {
    return `"${systemSnykPath}"`;
  }
  // Fallback to local binaries
  const localSnykPath = resolve(__dirname, '../snyk-standalone.exe');
  const localSnykAltPath = resolve(__dirname, '../snyk.exe');
  if (existsSync(localSnykPath)) {
    return `"${localSnykPath}"`;
  }
  if (existsSync(localSnykAltPath)) {
    return `"${localSnykAltPath}"`;
  }
  // Final fallback to npx (may trigger SmartScreen)
  return 'npx snyk --legacy-cli';
}

try {
  // Ensure reports directory exists
  mkdirSync(reportsDir, { recursive: true });

  console.log('🔒 Running Snyk vulnerability scan...');
  const snykCmd = getSnykCommand();
  console.log(`Using Snyk command: ${snykCmd}`);

  // Run snyk and capture output
  const result = execSync(`${snykCmd} test --json`, { encoding: 'utf8' });

  // Write the result to file manually (more reliable than --output-file)
  writeFileSync(reportFile, result);

  console.log(`✅ Snyk scan completed. Report saved to: ${reportFile}`);
} catch (err) {
  const errorMessage = err.message || err.toString();

  if (
    errorMessage.includes('Access is denied') ||
    errorMessage.includes('SmartScreen')
  ) {
    console.error('❌ Windows Security Blocking Snyk Execution');
    console.error('');
    console.error('🔧 Windows Enterprise Solutions:');
    console.error('1. Install Snyk via Chocolatey: choco install snyk -y');
    console.error('2. Or download MSI from: https://snyk.io/downloads');
    console.error('3. Unblock binaries: Get-ChildItem *.exe | Unblock-File');
    console.error('4. Run as Administrator for first-time setup');
    console.error('');
    console.error(
      "📋 Alternative: Use CI/CD pipeline where these restrictions don't apply"
    );
  } else {
    console.error('❌ Snyk scan failed:', errorMessage);
  }

  process.exit(1);
}
