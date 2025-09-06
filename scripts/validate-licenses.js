#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * License Validation Script
 * Validates license compliance for all dependencies
 */

class LicenseValidator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.licenseCheckPath = path.join(this.reportsDir, 'license-check.json');
  }

  async validate() {
    console.log('📋 Validating License Compliance...');

    try {
      if (!fs.existsSync(this.licenseCheckPath)) {
        console.error(
          '❌ License check file not found. Run license check first.'
        );
        process.exit(1);
      }

      const licenseData = JSON.parse(
        fs.readFileSync(this.licenseCheckPath, 'utf8')
      );

      const results = this.analyzeLicenses(licenseData);
      const report = this.generateReport(results);

      // Write detailed report
      const reportPath = path.join(
        this.reportsDir,
        'license-validation-report.json'
      );
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      // Display results
      this.displayResults(report);

      // Exit with appropriate code
      if (report.blockingIssues > 0) {
        console.error('❌ License validation failed - blocking issues found');
        process.exit(1);
      } else if (report.warnings > 0) {
        console.warn('⚠️ License validation completed with warnings');
        process.exit(0);
      } else {
        console.log('✅ License validation passed');
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error validating licenses:', error.message);
      process.exit(1);
    }
  }

  analyzeLicenses(licenseData) {
    const results = {
      totalPackages: 0,
      compliant: 0,
      warnings: 0,
      blocking: 0,
      licenseBreakdown: {},
      problematicPackages: [],
      warningPackages: [],
    };

    // Define license categories
    const compliantLicenses = [
      'MIT',
      'ISC',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'Apache-2.0',
      'BSD',
      'CC0-1.0',
      'Unlicense',
      'WTFPL',
      'Zlib',
    ];

    const warningLicenses = ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'CDDL-1.0'];

    const blockingLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL-1.0'];

    // Analyze each package
    Object.entries(licenseData).forEach(([packageName, packageInfo]) => {
      results.totalPackages++;

      const license = packageInfo.licenses || 'Unknown';
      results.licenseBreakdown[license] =
        (results.licenseBreakdown[license] || 0) + 1;

      // Check for blocking licenses
      if (blockingLicenses.some(blocking => license.includes(blocking))) {
        results.blocking++;
        results.problematicPackages.push({
          name: packageName,
          version: packageInfo.version,
          license: license,
          type: 'blocking',
          reason: 'Copyleft license may require source code disclosure',
        });
      }
      // Check for warning licenses
      else if (warningLicenses.some(warning => license.includes(warning))) {
        results.warnings++;
        results.warningPackages.push({
          name: packageName,
          version: packageInfo.version,
          license: license,
          type: 'warning',
          reason: 'Weak copyleft license - review compatibility',
        });
      }
      // Check for unknown licenses
      else if (
        license === 'Unknown' ||
        !compliantLicenses.some(compliant => license.includes(compliant))
      ) {
        results.warnings++;
        results.warningPackages.push({
          name: packageName,
          version: packageInfo.version,
          license: license,
          type: 'warning',
          reason: 'Unknown or non-standard license - requires review',
        });
      } else {
        results.compliant++;
      }
    });

    return results;
  }

  generateReport(results) {
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPackages: results.totalPackages,
        compliantPackages: results.compliant,
        warningPackages: results.warnings,
        blockingPackages: results.blocking,
        complianceRate: Math.round(
          (results.compliant / results.totalPackages) * 100
        ),
      },
      licenseBreakdown: results.licenseBreakdown,
      issues: {
        blocking: results.problematicPackages,
        warnings: results.warningPackages,
      },
      recommendations: this.generateRecommendations(results),
    };
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (results.blocking > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Replace blocking license packages',
        details: `${results.blocking} packages use GPL/AGPL licenses that may conflict with proprietary software distribution`,
        alternatives: 'Look for MIT/BSD licensed alternatives',
      });
    }

    if (results.warnings > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Review warning license packages',
        details: `${results.warnings} packages use licenses that require careful review`,
        alternatives: 'Consider MIT/BSD alternatives where possible',
      });
    }

    recommendations.push({
      priority: 'LOW',
      action: 'Implement license scanning in CI/CD',
      details: 'Automate license compliance checks in the build pipeline',
      alternatives: 'Use tools like FOSSA, Snyk, or WhiteSource',
    });

    recommendations.push({
      priority: 'LOW',
      action: 'Document license review process',
      details: 'Create guidelines for evaluating new dependency licenses',
      alternatives: 'Include license criteria in package evaluation checklist',
    });

    return recommendations;
  }

  displayResults(report) {
    console.log('\n📊 License Compliance Report');
    console.log('='.repeat(50));
    console.log(`Total Packages: ${report.summary.totalPackages}`);
    console.log(
      `✅ Compliant: ${report.summary.compliantPackages} (${report.summary.complianceRate}%)`
    );
    console.log(`⚠️ Warnings: ${report.summary.warningPackages}`);
    console.log(`❌ Blocking: ${report.summary.blockingPackages}`);

    if (report.issues.blocking.length > 0) {
      console.log('\n🚨 BLOCKING LICENSE ISSUES:');
      report.issues.blocking.forEach(pkg => {
        console.log(`  ❌ ${pkg.name}@${pkg.version} - ${pkg.license}`);
        console.log(`     Reason: ${pkg.reason}`);
      });
    }

    if (report.issues.warnings.length > 0) {
      console.log('\n⚠️ LICENSE WARNINGS:');
      report.issues.warnings.slice(0, 10).forEach(pkg => {
        console.log(`  ⚠️ ${pkg.name}@${pkg.version} - ${pkg.license}`);
        console.log(`    Reason: ${pkg.reason}`);
      });

      if (report.issues.warnings.length > 10) {
        console.log(`  ... and ${report.issues.warnings.length - 10} more`);
      }
    }

    console.log('\n📋 LICENSE BREAKDOWN:');
    Object.entries(report.licenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([license, count]) => {
        console.log(`  ${license}: ${count} packages`);
      });

    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(
        `  ${rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} ${rec.action}`
      );
      console.log(`     ${rec.details}`);
    });
  }
}

// Run the validator
const validator = new LicenseValidator();
validator.validate().catch(console.error);
