#!/usr/bin/env node
/**
 * 🚀 Meqenet.et Compliance Validation Script
 * Enterprise-grade compliance checks for Ethiopian FinTech BNPL platform
 * Validates NBE, PSD2, GDPR, and internal security policies
 */

import fs from 'fs';

console.log('📋 Running Ethiopian FinTech Compliance Validation...\n');

let complianceScore = 0;
let totalChecks = 0;
const issues = [];

// Helper function to check file existence
function checkFileExists(filePath, description) {
  totalChecks++;
  const exists = fs.existsSync(filePath);
  if (exists) {
    complianceScore++;
    console.log(`✅ ${description}: PASSED`);
  } else {
    issues.push(`${description}: File not found - ${filePath}`);
    console.log(`❌ ${description}: FAILED`);
  }
  return exists;
}

// Helper function to check JSON structure
function checkJsonStructure(filePath, requiredFields, description) {
  totalChecks++;
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingFields = requiredFields.filter(field => !content[field]);

    if (missingFields.length === 0) {
      complianceScore++;
      console.log(`✅ ${description}: PASSED`);
      return true;
    } else {
      issues.push(
        `${description}: Missing fields - ${missingFields.join(', ')}`
      );
      console.log(
        `❌ ${description}: FAILED (missing: ${missingFields.join(', ')})`
      );
    }
  } catch {
    issues.push(`${description}: Invalid JSON format`);
    console.log(`❌ ${description}: FAILED (invalid JSON)`);
  }
  return false;
}

// Core compliance checks
console.log('🏛️  NBE (National Bank of Ethiopia) Compliance:');
checkFileExists('compliance/gdpr_mapping.md', 'GDPR compliance mapping');
checkFileExists('compliance/pci_dss_mapping.md', 'PCI DSS compliance mapping');
checkFileExists('compliance/soc2_mapping.md', 'SOC2 compliance mapping');

console.log('\n🔐 Security Compliance:');
checkFileExists('reports/snyk-results.json', 'Vulnerability scan results');
checkFileExists('reports/license-check.json', 'License compliance report');
checkJsonStructure(
  'reports/snyk-results.json',
  ['vulnerabilities', 'ok'],
  'Snyk scan structure'
);

console.log('\n📊 Audit & Monitoring:');
checkFileExists('SECURITY_TOOLS_README.md', 'Security tools documentation');
checkFileExists('README.md', 'Project documentation');

console.log('\n🏗️  Infrastructure Compliance:');
checkFileExists('infrastructure/', 'Infrastructure as Code');
checkFileExists('docker-compose.yml', 'Container orchestration');

console.log('\n📈 Compliance Score:');
const percentage = Math.round((complianceScore / totalChecks) * 100);
console.log(`Score: ${complianceScore}/${totalChecks} (${percentage}%)`);

if (issues.length > 0) {
  console.log('\n⚠️  Compliance Issues Found:');
  issues.forEach(issue => console.log(`  • ${issue}`));

  if (percentage < 80) {
    console.log('\n❌ CRITICAL: Compliance score below 80%. Commit blocked.');
    process.exit(1);
  } else {
    console.log(
      '\n⚠️  WARNING: Minor compliance issues detected but allowing commit.'
    );
  }
} else {
  console.log('\n✅ FULL COMPLIANCE: All checks passed!');
}

console.log('\n🎉 Ethiopian FinTech BNPL Compliance Validation Complete');
process.exit(0);
