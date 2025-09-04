#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Dependency Security Report Generator
 * Analyzes various security scan results and generates comprehensive reports
 */

class DependencyReportGenerator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generateReport() {
    console.log('🔍 Generating Dependency Security Report...');

    const report = {
      title: 'Meqenet Dependency Security Report',
      generatedAt: new Date().toISOString(),
      sections: []
    };

    try {
      // NPM Audit Report
      const npmAuditReport = await this.generateNpmAuditSection();
      report.sections.push(npmAuditReport);

      // Snyk Report
      const snykReport = await this.generateSnykSection();
      report.sections.push(snykReport);

      // OWASP Report
      const owaspReport = await this.generateOwaspSection();
      report.sections.push(owaspReport);

      // License Report
      const licenseReport = await this.generateLicenseSection();
      report.sections.push(licenseReport);

      // Generate summary
      report.summary = this.generateSummary(report.sections);

      // Write report
      await this.writeReport(report);

      console.log('✅ Dependency security report generated successfully!');
      console.log(`📄 Report saved to: ${path.join(this.reportsDir, 'dependency-security-report.json')}`);

    } catch (error) {
      console.error('❌ Error generating dependency report:', error.message);
      process.exit(1);
    }
  }

  async generateNpmAuditSection() {
    const npmAuditPath = path.join(this.reportsDir, 'npm-audit.json');

    try {
      if (fs.existsSync(npmAuditPath)) {
        const data = JSON.parse(fs.readFileSync(npmAuditPath, 'utf8'));

        const vulnerabilities = data.vulnerabilities || {};
        const vulnCount = Object.keys(vulnerabilities).length;
        const criticalCount = Object.values(vulnerabilities).filter(v => v.severity === 'critical').length;
        const highCount = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;

        return {
          name: 'NPM Audit',
          totalVulnerabilities: vulnCount,
          criticalVulnerabilities: criticalCount,
          highVulnerabilities: highCount,
          status: vulnCount === 0 ? 'SECURE' : criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'WARNING' : 'MINOR',
          issues: Object.values(vulnerabilities).slice(0, 10).map(vuln => ({
            package: vuln.name,
            severity: vuln.severity,
            title: vuln.title,
            recommendation: 'Update to latest secure version'
          })),
          recommendations: [
            'Run npm audit fix to automatically fix issues',
            'Update vulnerable packages to latest versions',
            'Review and test changes after updates',
            'Consider using npm audit --production for production-only vulnerabilities'
          ]
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not read NPM audit report:', error.message);
    }

    return {
      name: 'NPM Audit',
      totalVulnerabilities: 0,
      status: 'NOT_RUN',
      issues: [],
      recommendations: ['Run npm audit to check for vulnerabilities']
    };
  }

  async generateSnykSection() {
    const snykPath = path.join(this.reportsDir, 'snyk-results.json');

    try {
      if (fs.existsSync(snykPath)) {
        const data = JSON.parse(fs.readFileSync(snykPath, 'utf8'));

        const vulnerabilities = data.vulnerabilities || [];
        const uniquePackages = [...new Set(vulnerabilities.map(v => v.packageName))];

        const severityCounts = vulnerabilities.reduce((acc, vuln) => {
          acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
          return acc;
        }, {});

        return {
          name: 'Snyk Vulnerability Scan',
          totalVulnerabilities: vulnerabilities.length,
          affectedPackages: uniquePackages.length,
          severityBreakdown: severityCounts,
          status: vulnerabilities.length === 0 ? 'SECURE' :
                 severityCounts.critical > 0 || severityCounts.high > 0 ? 'CRITICAL' : 'WARNING',
          issues: vulnerabilities.slice(0, 10).map(vuln => ({
            package: vuln.packageName,
            version: vuln.version,
            severity: vuln.severity,
            title: vuln.title,
            cve: vuln.identifiers?.CVE?.[0] || 'N/A'
          })),
          recommendations: [
            'Fix vulnerabilities using Snyk CLI: snyk wizard',
            'Update package.json with secure versions',
            'Consider using Snyk Advisor for package insights',
            'Implement automated Snyk scans in CI/CD pipeline'
          ]
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not read Snyk report:', error.message);
    }

    return {
      name: 'Snyk Vulnerability Scan',
      totalVulnerabilities: 0,
      status: 'NOT_RUN',
      issues: [],
      recommendations: ['Run Snyk test to scan for vulnerabilities']
    };
  }

  async generateOwaspSection() {
    const owaspPath = path.join(this.reportsDir, 'bom.json');

    try {
      if (fs.existsSync(owaspPath)) {
        const data = JSON.parse(fs.readFileSync(owaspPath, 'utf8'));

        const components = data.components || [];
        const vulnerabilities = data.vulnerabilities || [];

        return {
          name: 'OWASP Dependency Check',
          totalComponents: components.length,
          totalVulnerabilities: vulnerabilities.length,
          status: vulnerabilities.length === 0 ? 'SECURE' : 'WARNING',
          issues: vulnerabilities.slice(0, 10).map(vuln => ({
            component: vuln.affects?.[0]?.ref || 'Unknown',
            severity: vuln.ratings?.[0]?.severity || 'Unknown',
            description: vuln.description,
            cwe: vuln.cwe?.id || 'N/A'
          })),
          recommendations: [
            'Review OWASP Dependency Check report for detailed analysis',
            'Update vulnerable components to secure versions',
            'Use OWASP Dependency Check regularly in CI/CD',
            'Consider using Nexus IQ or similar for policy enforcement'
          ]
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not read OWASP report:', error.message);
    }

    return {
      name: 'OWASP Dependency Check',
      totalComponents: 0,
      status: 'NOT_RUN',
      issues: [],
      recommendations: ['Run OWASP Dependency Check for comprehensive analysis']
    };
  }

  async generateLicenseSection() {
    const licensePath = path.join(this.reportsDir, 'license-check.json');

    try {
      if (fs.existsSync(licensePath)) {
        const data = JSON.parse(fs.readFileSync(licensePath, 'utf8'));

        const licenses = Object.values(data).reduce((acc, pkg) => {
          const license = pkg.licenses || 'Unknown';
          acc[license] = (acc[license] || 0) + 1;
          return acc;
        }, {});

        const problematicLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL-1.0'];
        const hasProblematicLicenses = Object.keys(licenses).some(license =>
          problematicLicenses.some(problematic => license.includes(problematic))
        );

        return {
          name: 'License Compliance Check',
          totalPackages: Object.keys(data).length,
          licenseBreakdown: licenses,
          status: hasProblematicLicenses ? 'WARNING' : 'COMPLIANT',
          issues: hasProblematicLicenses ? [{
            title: 'Potentially problematic licenses detected',
            description: 'Some dependencies use licenses that may have copyleft implications',
            packages: Object.entries(data)
              .filter(([_, pkg]) =>
                problematicLicenses.some(problematic =>
                  (pkg.licenses || '').includes(problematic)
                )
              )
              .map(([name, pkg]) => `${name}@${pkg.version}`)
          }] : [],
          recommendations: [
            'Review license compatibility with business requirements',
            'Consider replacing GPL-licensed packages with MIT/BSD alternatives',
            'Document license review process for new dependencies',
            'Use automated license checking in CI/CD pipeline'
          ]
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not read license report:', error.message);
    }

    return {
      name: 'License Compliance Check',
      totalPackages: 0,
      status: 'NOT_RUN',
      issues: [],
      recommendations: ['Run license compliance check for all dependencies']
    };
  }

  generateSummary(sections) {
    const totalVulnerabilities = sections.reduce((sum, section) =>
      sum + (section.totalVulnerabilities || 0), 0
    );

    const criticalIssues = sections.some(section =>
      section.status === 'CRITICAL' || section.criticalVulnerabilities > 0
    );

    const hasIssues = sections.some(section =>
      section.status === 'WARNING' || section.status === 'CRITICAL'
    );

    let overallStatus = 'SECURE';
    if (criticalIssues) overallStatus = 'CRITICAL';
    else if (hasIssues) overallStatus = 'WARNING';

    return {
      overallStatus,
      totalVulnerabilities,
      sectionsScanned: sections.length,
      sectionsWithIssues: sections.filter(s => s.status !== 'SECURE' && s.status !== 'NOT_RUN').length,
      riskLevel: criticalIssues ? 'HIGH' : hasIssues ? 'MEDIUM' : 'LOW',
      nextSteps: this.generateNextSteps(overallStatus, totalVulnerabilities)
    };
  }

  generateNextSteps(status, vulnCount) {
    const steps = [];

    if (status === 'CRITICAL') {
      steps.push('🚨 CRITICAL: Address high-severity vulnerabilities immediately');
      steps.push('📋 Review all critical and high-severity issues in reports above');
      steps.push('🔄 Update vulnerable dependencies to secure versions');
      steps.push('🧪 Test thoroughly after dependency updates');
    } else if (status === 'WARNING') {
      steps.push('⚠️ Address medium/low-severity vulnerabilities within 30 days');
      steps.push('📈 Prioritize updates based on CVSS scores and exploitability');
      steps.push('🔍 Review license compliance issues');
    } else {
      steps.push('✅ Dependencies appear secure');
      steps.push('🔄 Continue regular dependency scans');
    }

    if (vulnCount > 0) {
      steps.push(`📊 ${vulnCount} vulnerabilities identified across all scans`);
    }

    steps.push('📅 Schedule weekly dependency security reviews');
    steps.push('🤖 Implement automated dependency updates (Dependabot/Renovate)');
    steps.push('📚 Train team on dependency security best practices');

    return steps;
  }

  async writeReport(report) {
    const reportPath = path.join(this.reportsDir, 'dependency-security-report.json');
    const htmlPath = path.join(this.reportsDir, 'dependency-security-report.html');

    // Write JSON report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlContent = this.generateHTMLReport(report);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`📄 HTML Report: ${htmlPath}`);
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${report.summary.overallStatus === 'SECURE' ? '#10b981' : report.summary.overallStatus === 'CRITICAL' ? '#ef4444' : '#f59e0b'}; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .status.secure { background: #d1fae5; color: #065f46; }
        .status.critical { background: #fee2e2; color: #991b1b; }
        .status.warning { background: #fef3c7; color: #92400e; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .section h3 { margin-top: 0; color: #374151; }
        .issues { margin-top: 15px; }
        .issue { padding: 10px; margin-bottom: 10px; border-left: 4px solid #ef4444; background: #fef2f2; }
        .issue.warning { border-left-color: #f59e0b; background: #fffbeb; }
        .recommendations { background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 15px; }
        .summary { background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .next-steps { background: #ecfdf5; padding: 20px; border-radius: 6px; }
        .next-steps ul { margin: 0; padding-left: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #374151; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.title}</h1>
            <div class="score">${report.summary.totalVulnerabilities}</div>
            <div class="status ${report.summary.overallStatus.toLowerCase()}">${report.summary.overallStatus}</div>
            <p><strong>Risk Level:</strong> ${report.summary.riskLevel}</p>
            <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${report.summary.totalVulnerabilities}</div>
                <div class="metric-label">Total Vulnerabilities</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.sectionsScanned}</div>
                <div class="metric-label">Tools Scanned</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.sectionsWithIssues}</div>
                <div class="metric-label">Sections with Issues</div>
            </div>
        </div>

        <div class="summary">
            <h2>Summary</h2>
            <p><strong>Overall Status:</strong> ${report.summary.overallStatus}</p>
            <p><strong>Risk Level:</strong> ${report.summary.riskLevel}</p>
            <p><strong>Sections Scanned:</strong> ${report.summary.sectionsScanned}</p>
        </div>

        <div class="next-steps">
            <h2>Next Steps</h2>
            <ul>
                ${report.summary.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
        </div>

        ${report.sections.map(section => `
            <div class="section">
                <h3>${section.name}</h3>
                <p><strong>Status:</strong>
                    <span class="status ${section.status?.toLowerCase() || 'secure'}">${section.status || 'SECURE'}</span>
                </p>

                ${section.totalVulnerabilities !== undefined ? `<p><strong>Vulnerabilities:</strong> ${section.totalVulnerabilities}</p>` : ''}
                ${section.affectedPackages !== undefined ? `<p><strong>Affected Packages:</strong> ${section.affectedPackages}</p>` : ''}
                ${section.totalComponents !== undefined ? `<p><strong>Total Components:</strong> ${section.totalComponents}</p>` : ''}

                ${section.issues && section.issues.length > 0 ? `
                    <div class="issues">
                        <h4>Issues Found (${section.issues.length})</h4>
                        ${section.issues.map(issue => `
                            <div class="issue ${issue.severity?.toLowerCase() === 'critical' || issue.severity?.toLowerCase() === 'high' ? '' : 'warning'}">
                                <strong>${issue.package || issue.title || 'Issue'}</strong>
                                ${issue.version ? `<br><small>Version: ${issue.version}</small>` : ''}
                                ${issue.severity ? `<br><small>Severity: ${issue.severity}</small>` : ''}
                                ${issue.title && issue.package !== issue.title ? `<br><small>${issue.title}</small>` : ''}
                                ${issue.description ? `<br><small>${issue.description}</small>` : ''}
                                ${issue.cve && issue.cve !== 'N/A' ? `<br><small>CVE: ${issue.cve}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>✅ No issues found</p>'}

                <div class="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${section.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }
}

// Run the report generator
const generator = new DependencyReportGenerator();
generator.generateReport().catch(console.error);
