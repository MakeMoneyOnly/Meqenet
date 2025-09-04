#!/usr/bin/env node

/**
 * CodeQL Results Validation Script
 * Enterprise-grade validation for Meqenet FinTech platform
 *
 * This script validates CodeQL analysis results and performs compliance verification
 * according to fintech industry standards.
 *
 * Usage: node scripts/verify-codeql-results.js [sarif-file-path]
 */

const fs = require('fs');
const path = require('path');

class CodeQLResultsValidator {
  constructor() {
    this.results = null;
    this.compliance = {
      owasp: false,
      pci_dss: false,
      nbe: false,
      overall: false,
    };
    this.metrics = {
      totalFiles: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      informational: 0,
    };
  }

  /**
   * Load and parse SARIF file
   */
  loadSarifResults(sarifPath) {
    try {
      console.log('🔍 Loading SARIF results from:', sarifPath);

      if (!fs.existsSync(sarifPath)) {
        throw new Error(`SARIF file not found: ${sarifPath}`);
      }

      const sarifContent = fs.readFileSync(sarifPath, 'utf8');
      this.results = JSON.parse(sarifContent);

      console.log('✅ SARIF file loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading SARIF file:', error.message);
      return false;
    }
  }

  /**
   * Extract security metrics from results
   */
  extractMetrics() {
    if (!this.results?.runs?.[0]?.results) {
      console.warn('⚠️ No results found in SARIF file');
      return;
    }

    const results = this.results.runs[0].results;
    console.log(`📊 Analyzing ${results.length} security findings...`);

    results.forEach(result => {
      // Determine severity
      const severity = this.determineSeverity(result);

      // Categorize by severity
      switch (severity) {
        case 'critical':
          this.metrics.criticalIssues++;
          break;
        case 'high':
          this.metrics.highIssues++;
          break;
        case 'medium':
          this.metrics.mediumIssues++;
          break;
        case 'low':
          this.metrics.lowIssues++;
          break;
        default:
          this.metrics.informational++;
      }
    });

    // Count unique files analyzed
    const files = new Set();
    results.forEach(result => {
      if (result.locations?.[0]?.physicalLocation?.artifactLocation?.uri) {
        files.add(result.locations[0].physicalLocation.artifactLocation.uri);
      }
    });
    this.metrics.totalFiles = files.size;

    console.log('✅ Metrics extracted successfully');
  }

  /**
   * Determine severity of a security finding
   */
  determineSeverity(result) {
    // Check rule tags for severity indicators
    const tags = result.rule?.properties?.tags || [];
    const ruleId = result.rule?.id || '';

    // Critical severity indicators
    if (
      tags.includes('security-severity-critical') ||
      ruleId.includes('sql-injection') ||
      ruleId.includes('hardcoded-credentials') ||
      ruleId.includes('insecure-crypto')
    ) {
      return 'critical';
    }

    // High severity indicators
    if (
      tags.includes('security-severity-high') ||
      ruleId.includes('cleartext-storage') ||
      ruleId.includes('cleartext-transmission') ||
      ruleId.includes('dangerous-permissions')
    ) {
      return 'high';
    }

    // Medium severity indicators
    if (
      tags.includes('security-severity-medium') ||
      ruleId.includes('webview-javascript-enabled') ||
      ruleId.includes('overly-permissive-permissions')
    ) {
      return 'medium';
    }

    // Low severity indicators
    if (
      tags.includes('security-severity-low') ||
      ruleId.includes('insecure-random') ||
      ruleId.includes('implicit-pendingintent')
    ) {
      return 'low';
    }

    return 'informational';
  }

  /**
   * Perform compliance verification
   */
  verifyCompliance() {
    console.log('🔒 Performing compliance verification...');

    // OWASP Top 10 Compliance
    this.compliance.owasp =
      this.metrics.criticalIssues === 0 && this.metrics.highIssues <= 5;

    // PCI DSS Compliance (stricter requirements)
    this.compliance.pci_dss =
      this.metrics.criticalIssues === 0 && this.metrics.highIssues === 0;

    // NBE Standards (Ethiopian banking regulations)
    this.compliance.nbe =
      this.metrics.criticalIssues === 0 && this.metrics.highIssues <= 3;

    // Overall compliance
    this.compliance.overall =
      this.compliance.owasp && this.compliance.pci_dss && this.compliance.nbe;

    console.log('✅ Compliance verification completed');
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      analysis_type: 'codeql',
      summary: {
        files_analyzed: this.metrics.totalFiles,
        total_findings:
          Object.values(this.metrics).reduce((a, b) => a + b, 0) -
          this.metrics.totalFiles,
        critical_issues: this.metrics.criticalIssues,
        high_issues: this.metrics.highIssues,
        medium_issues: this.metrics.mediumIssues,
        low_issues: this.metrics.lowIssues,
        informational: this.metrics.informational,
      },
      compliance: this.compliance,
      recommendations: this.generateRecommendations(),
      enterprise_assessment: this.generateEnterpriseAssessment(),
    };

    return report;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.criticalIssues > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Address all critical security issues immediately',
        impact: 'Required for PCI DSS and NBE compliance',
        timeframe: 'Within 24 hours',
      });
    }

    if (this.metrics.highIssues > 5) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Review and remediate high-severity security issues',
        impact: 'May impact OWASP compliance',
        timeframe: 'Within 1 week',
      });
    }

    if (!this.compliance.overall) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Conduct comprehensive security review',
        impact: 'Ensure all compliance requirements are met',
        timeframe: 'Within 2 weeks',
      });
    }

    recommendations.push({
      priority: 'LOW',
      action: 'Implement automated security testing in CI/CD',
      impact: 'Prevent future security issues',
      timeframe: 'Next development cycle',
    });

    return recommendations;
  }

  /**
   * Generate enterprise-level assessment
   */
  generateEnterpriseAssessment() {
    return {
      risk_level: this.calculateRiskLevel(),
      business_impact: this.assessBusinessImpact(),
      regulatory_status: this.assessRegulatoryStatus(),
      next_steps: this.defineNextSteps(),
    };
  }

  /**
   * Calculate overall risk level
   */
  calculateRiskLevel() {
    if (this.metrics.criticalIssues > 0) return 'CRITICAL';
    if (this.metrics.highIssues > 3) return 'HIGH';
    if (this.metrics.mediumIssues > 10) return 'MEDIUM';
    if (this.metrics.lowIssues > 20) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Assess business impact
   */
  assessBusinessImpact() {
    if (this.metrics.criticalIssues > 0) {
      return 'HIGH - May require system downtime for remediation';
    }
    if (this.metrics.highIssues > 3) {
      return 'MEDIUM - Potential security vulnerabilities affecting user trust';
    }
    return 'LOW - Standard security maintenance required';
  }

  /**
   * Assess regulatory compliance status
   */
  assessRegulatoryStatus() {
    const status = {
      pci_dss: this.compliance.pci_dss ? 'COMPLIANT' : 'REQUIRES REVIEW',
      owasp: this.compliance.owasp ? 'COMPLIANT' : 'REQUIRES REVIEW',
      nbe: this.compliance.nbe ? 'COMPLIANT' : 'REQUIRES REVIEW',
    };

    return status;
  }

  /**
   * Define next steps
   */
  defineNextSteps() {
    const steps = [
      'Review detailed security findings',
      'Prioritize remediation based on severity',
      'Update security incident log',
      'Notify relevant stakeholders',
    ];

    if (!this.compliance.overall) {
      steps.push('Conduct compliance gap analysis');
      steps.push('Implement remediation plan');
    }

    steps.push('Schedule follow-up security assessment');

    return steps;
  }

  /**
   * Display formatted report
   */
  displayReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🏦 MEQENET FINTECH - CODEQL SECURITY ANALYSIS REPORT');
    console.log('='.repeat(80));
    console.log(
      `📅 Report Date: ${new Date(report.timestamp).toLocaleString()}`
    );
    console.log(`📊 Files Analyzed: ${report.summary.files_analyzed}`);
    console.log(`🚨 Total Findings: ${report.summary.total_findings}`);
    console.log('');

    console.log('📈 SECURITY METRICS:');
    console.log(`  🔴 Critical Issues: ${report.summary.critical_issues}`);
    console.log(`  🟠 High Issues: ${report.summary.high_issues}`);
    console.log(`  🟡 Medium Issues: ${report.summary.medium_issues}`);
    console.log(`  🟢 Low Issues: ${report.summary.low_issues}`);
    console.log(`  ℹ️  Informational: ${report.summary.informational}`);
    console.log('');

    console.log('🔒 COMPLIANCE STATUS:');
    console.log(
      `  PCI DSS: ${report.compliance.pci_dss ? '✅ COMPLIANT' : '❌ REQUIRES REVIEW'}`
    );
    console.log(
      `  OWASP Top 10: ${report.compliance.owasp ? '✅ COMPLIANT' : '❌ REQUIRES REVIEW'}`
    );
    console.log(
      `  NBE Standards: ${report.compliance.nbe ? '✅ COMPLIANT' : '❌ REQUIRES REVIEW'}`
    );
    console.log(
      `  Overall: ${report.compliance.overall ? '✅ COMPLIANT' : '❌ REQUIRES REVIEW'}`
    );
    console.log('');

    console.log('🏢 ENTERPRISE ASSESSMENT:');
    console.log(`  🎯 Risk Level: ${report.enterprise_assessment.risk_level}`);
    console.log(
      `  📝 Business Impact: ${report.enterprise_assessment.business_impact}`
    );
    console.log('');

    console.log('📋 REGULATORY STATUS:');
    Object.entries(report.enterprise_assessment.regulatory_status).forEach(
      ([regulatory, status]) => {
        console.log(`  ${regulatory.toUpperCase()}: ${status}`);
      }
    );
    console.log('');

    if (report.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`     Impact: ${rec.impact}`);
        console.log(`     Timeframe: ${rec.timeframe}`);
        console.log('');
      });
    }

    console.log('🎯 NEXT STEPS:');
    report.enterprise_assessment.next_steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('📄 Report generated by CodeQL Results Validator v1.0');
    console.log('🏦 Meqenet FinTech Platform - Enterprise Security Analysis');
    console.log('='.repeat(80));
  }

  /**
   * Save report to file
   */
  saveReport(report, outputPath) {
    try {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`💾 Report saved to: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving report:', error.message);
      return false;
    }
  }

  /**
   * Main execution method
   */
  async run(sarifPath, outputPath = null) {
    console.log('🚀 Starting CodeQL Results Validation...');
    console.log('🏦 Meqenet FinTech Platform - Enterprise Security Analysis');
    console.log('');

    // Load SARIF results
    if (!this.loadSarifResults(sarifPath)) {
      process.exit(1);
    }

    // Extract metrics
    this.extractMetrics();

    // Verify compliance
    this.verifyCompliance();

    // Generate report
    const report = this.generateReport();

    // Display report
    this.displayReport(report);

    // Save report if output path provided
    if (outputPath) {
      this.saveReport(report, outputPath);
    }

    // Exit with appropriate code
    const exitCode = report.compliance.overall ? 0 : 1;
    console.log(`\n🏁 Validation completed with exit code: ${exitCode}`);
    process.exit(exitCode);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const sarifPath = args[0] || 'results/javascript.sarif';
  const outputPath = args[1] || 'security-validation-report.json';

  const validator = new CodeQLResultsValidator();
  validator.run(sarifPath, outputPath).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CodeQLResultsValidator;
