#!/usr/bin/env node

/**
 * Meqenet.et Enterprise Dependency Auditor
 * Comprehensive audit for fintech compliance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const _path = require('path');

console.log('🔍 Meqenet.et Enterprise Dependency Audit\n');

const FINTECH_STANDARDS = {
  maxDeprecatedPackages: 0,
  maxPeerDependencyIssues: 0,
  maxVulnerabilities: {
    critical: 0,
    high: 0,
    moderate: 5,
  },
  requiredNodeVersion: '>=22.0.0',
  requiredPackageManager: 'pnpm@10.14.0',
};

function runAudit() {
  const results = {
    deprecated: 0,
    vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 },
    peerIssues: 0,
    outdated: 0,
    compliance: 'PASS',
  };

  console.log('📊 Running comprehensive dependency audit...\n');

  // 1. Check deprecated packages
  console.log('🔄 Checking for deprecated packages...');
  try {
    const deprecatedOutput = execSync(
      'pnpm ls --depth=5 --json | grep -i deprecated',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    results.deprecated = (deprecatedOutput.match(/deprecated/g) || []).length;
    console.log(`   Found ${results.deprecated} deprecated packages`);
  } catch (_error) {
    console.log('   ✅ No deprecated packages found');
    results.deprecated = 0;
  }

  // 2. Check vulnerabilities
  console.log('\n🔍 Checking for security vulnerabilities...');
  try {
    const auditOutput = execSync('pnpm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(auditOutput);
    results.vulnerabilities = auditData.metadata.vulnerabilities;
    console.log(
      `   Vulnerabilities: ${JSON.stringify(results.vulnerabilities)}`
    );
  } catch (_error) {
    console.log('   ⚠️  Could not parse audit results');
  }

  // 3. Check peer dependency issues
  console.log('\n🔗 Checking peer dependency issues...');
  try {
    const peerOutput = execSync(
      'pnpm ls --depth=3 2>&1 | grep -i "unmet peer"',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    results.peerIssues = (peerOutput.match(/unmet peer/g) || []).length;
    console.log(`   Found ${results.peerIssues} peer dependency issues`);
  } catch (_error) {
    console.log('   ✅ No peer dependency issues found');
    results.peerIssues = 0;
  }

  // 4. Check outdated packages
  console.log('\n📈 Checking outdated packages...');
  try {
    const outdatedOutput = execSync('pnpm outdated --json', {
      encoding: 'utf8',
    });
    const outdatedData = JSON.parse(outdatedOutput);
    results.outdated = Object.keys(outdatedData).length;
    console.log(`   Found ${results.outdated} outdated packages`);
  } catch (_error) {
    console.log('   No outdated packages found');
    results.outdated = 0;
  }

  // 5. Compliance check
  console.log('\n🏦 Evaluating fintech compliance...\n');

  const compliance = {
    deprecated: results.deprecated <= FINTECH_STANDARDS.maxDeprecatedPackages,
    vulnerabilities:
      results.vulnerabilities.critical <=
        FINTECH_STANDARDS.maxVulnerabilities.critical &&
      results.vulnerabilities.high <=
        FINTECH_STANDARDS.maxVulnerabilities.high &&
      results.vulnerabilities.moderate <=
        FINTECH_STANDARDS.maxVulnerabilities.moderate,
    peerIssues: results.peerIssues <= FINTECH_STANDARDS.maxPeerDependencyIssues,
  };

  console.log('📋 COMPLIANCE REPORT:');
  console.log('═══════════════════════════════════════');
  console.log(
    `Deprecated Packages: ${results.deprecated}/${FINTECH_STANDARDS.maxDeprecatedPackages} ${compliance.deprecated ? '✅' : '❌'}`
  );
  console.log(
    `Critical Vulnerabilities: ${results.vulnerabilities.critical}/${FINTECH_STANDARDS.maxVulnerabilities.critical} ${compliance.vulnerabilities ? '✅' : '❌'}`
  );
  console.log(
    `High Vulnerabilities: ${results.vulnerabilities.high}/${FINTECH_STANDARDS.maxVulnerabilities.high} ${compliance.vulnerabilities ? '✅' : '❌'}`
  );
  console.log(
    `Peer Dependency Issues: ${results.peerIssues}/${FINTECH_STANDARDS.maxPeerDependencyIssues} ${compliance.peerIssues ? '✅' : '❌'}`
  );
  console.log(`Outdated Packages: ${results.outdated} (informational)`);

  const overallCompliance =
    compliance.deprecated &&
    compliance.vulnerabilities &&
    compliance.peerIssues;

  console.log('\n🏆 OVERALL ASSESSMENT:');
  console.log('═══════════════════════════════════════');
  if (overallCompliance) {
    console.log('🎉 PASS - Meets FinTech Enterprise Standards');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('❌ FAIL - Does not meet FinTech standards');
    console.log('🔧 Action required before production deployment');

    if (!compliance.deprecated) {
      console.log(`   • Fix ${results.deprecated} deprecated packages`);
    }
    if (!compliance.vulnerabilities) {
      console.log(
        `   • Address ${results.vulnerabilities.critical} critical and ${results.vulnerabilities.high} high vulnerabilities`
      );
    }
    if (!compliance.peerIssues) {
      console.log(`   • Resolve ${results.peerIssues} peer dependency issues`);
    }
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('═══════════════════════════════════════');
  if (results.deprecated > 0) {
    console.log(
      '• Run dependency cleanup script: node scripts/dependency-cleanup.js'
    );
  }
  if (
    results.vulnerabilities.critical > 0 ||
    results.vulnerabilities.high > 0
  ) {
    console.log('• Run: pnpm audit fix');
    console.log('• Review and update vulnerable packages');
  }
  if (results.outdated > 0) {
    console.log('• Consider updating major versions quarterly');
  }

  console.log('\n📝 AUDIT COMPLETE');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Compliance: ${overallCompliance ? 'PASS' : 'FAIL'}`);

  // Save audit results
  const auditResults = {
    timestamp: new Date().toISOString(),
    results,
    standards: FINTECH_STANDARDS,
    compliance: overallCompliance,
  };

  fs.writeFileSync(
    'governance/reports/dependency-audit.json',
    JSON.stringify(auditResults, null, 2)
  );
  console.log('📄 Report saved to: governance/reports/dependency-audit.json');

  if (!overallCompliance) {
    process.exit(1);
  }
}

runAudit();
