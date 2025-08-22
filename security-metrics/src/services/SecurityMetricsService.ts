/**
 * Security Metrics Service
 * Handles collection, processing, and management of security metrics data
 */

import {
  SecurityMetrics,
  VulnerabilityMetrics,
  TestCoverageMetrics,
  PerformanceMetrics,
  ComplianceMetrics,
  IncidentMetrics,
  SecurityReport,
  SecurityAlert,
  AlertThresholds
} from '../models/SecurityMetrics';

export class SecurityMetricsService {
  private static instance: SecurityMetricsService;
  private metrics: Map<string, SecurityMetrics> = new Map();
  private alerts: SecurityAlert[] = [];
  private thresholds: AlertThresholds;

  constructor() {
    this.thresholds = {
      criticalVulnerabilities: 0,
      highVulnerabilities: 5,
      scanFailureRate: 10,
      responseTimeDegradation: 20,
      complianceDrop: 5
    };
  }

  static getInstance(): SecurityMetricsService {
    if (!SecurityMetricsService.instance) {
      SecurityMetricsService.instance = new SecurityMetricsService();
    }
    return SecurityMetricsService.instance;
  }

  /**
   * Collect security metrics from various sources
   */
  async collectMetrics(environment: string = 'production'): Promise<SecurityMetrics> {
    try {
      console.log(`🔍 Collecting security metrics for ${environment} environment`);

      // Collect data from multiple sources in parallel
      const [
        vulnerabilityData,
        testCoverageData,
        performanceData,
        complianceData,
        incidentData
      ] = await Promise.all([
        this.collectVulnerabilityMetrics(),
        this.collectTestCoverageMetrics(),
        this.collectPerformanceMetrics(),
        this.collectComplianceMetrics(),
        this.collectIncidentMetrics()
      ]);

      const metrics: SecurityMetrics = {
        vulnerabilities: vulnerabilityData,
        testCoverage: testCoverageData,
        performance: performanceData,
        compliance: complianceData,
        incidents: incidentData,
        timestamp: new Date(),
        period: 'daily',
        environment: environment as any
      };

      // Store metrics
      const key = `${environment}_${Date.now()}`;
      this.metrics.set(key, metrics);

      // Check for alerts
      await this.checkAlerts(metrics);

      console.log(`✅ Security metrics collected for ${environment}`);
      return metrics;

    } catch (error) {
      console.error('❌ Error collecting security metrics:', error);
      throw error;
    }
  }

  /**
   * Collect vulnerability metrics from various security tools
   */
  private async collectVulnerabilityMetrics(): Promise<VulnerabilityMetrics> {
    try {
      // Simulate data collection from security tools
      // In real implementation, this would query:
      // - CodeQL results
      // - OWASP Dependency Check results
      // - SAST tool results
      // - DAST tool results

      const mockData: VulnerabilityMetrics = {
        totalVulnerabilities: 12,
        criticalVulnerabilities: 0,
        highVulnerabilities: 3,
        mediumVulnerabilities: 6,
        lowVulnerabilities: 3,
        infoVulnerabilities: 0,
        newVulnerabilities: 2,
        resolvedVulnerabilities: 5,
        openVulnerabilities: 12,
        meanTimeToDetect: 24, // hours
        meanTimeToRemediate: 168, // hours (1 week)
        vulnerabilitiesByAge: {
          '0-7days': 2,
          '8-30days': 4,
          '31-90days': 4,
          '90+days': 2
        },
        topCategories: [
          { category: 'Injection', count: 4, percentage: 33.3 },
          { category: 'Cryptographic Failures', count: 3, percentage: 25.0 },
          { category: 'Security Misconfiguration', count: 3, percentage: 25.0 },
          { category: 'Authentication Failures', count: 2, percentage: 16.7 }
        ]
      };

      return mockData;

    } catch (error) {
      console.error('Error collecting vulnerability metrics:', error);
      throw error;
    }
  }

  /**
   * Collect test coverage metrics
   */
  private async collectTestCoverageMetrics(): Promise<TestCoverageMetrics> {
    try {
      const mockData: TestCoverageMetrics = {
        sastCoverage: 95.2,
        sastLinesAnalyzed: 125000,
        sastIssuesFound: 12,
        sastCriticalIssues: 0,

        dastCoverage: 87.5,
        dastTestsRun: 245,
        dastIssuesFound: 8,
        dastCriticalIssues: 1,

        securityTestCases: 150,
        securityTestCasesExecuted: 142,
        securityTestCoverage: 94.7,

        mastCoverage: 92.3,
        mastTestsRun: 89,
        mastIssuesFound: 3,

        dependencyTestsRun: 45,
        dependencyVulnerabilities: 2,
        dependencyCoverage: 88.9
      };

      return mockData;

    } catch (error) {
      console.error('Error collecting test coverage metrics:', error);
      throw error;
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const mockData: PerformanceMetrics = {
        averageScanTime: 15.5, // minutes
        scanSuccessRate: 98.7,
        scanFailureRate: 1.3,
        securityOverhead: 2.1, // percentage
        memoryUsage: 256, // MB
        cpuUsage: 12.5, // percentage
        averageResponseTime: 245, // milliseconds
        percentile95ResponseTime: 450,
        percentile99ResponseTime: 850,
        peakMemoryUsage: 512,
        peakCpuUsage: 25.0,
        concurrentUsersSupported: 10000
      };

      return mockData;

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Collect compliance metrics
   */
  private async collectComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const mockData: ComplianceMetrics = {
        owaspCompliance: 87.5,
        owaspControlsImplemented: 35,
        owaspTotalControls: 40,

        pciCompliance: 92.3,
        pciRequirementsMet: 144,
        pciTotalRequirements: 156,

        gdprCompliance: 85.7,
        gdprControlsImplemented: 30,
        gdprTotalControls: 35,

        psd2Compliance: 90.0,
        psd2RequirementsMet: 45,
        psd2TotalRequirements: 50,

        iso27001Compliance: 88.2,
        iso27001ControlsImplemented: 97,
        iso27001TotalControls: 110,

        customComplianceFrameworks: [
          {
            name: 'Internal Security Standards',
            compliance: 91.4,
            requirementsMet: 32,
            totalRequirements: 35
          }
        ]
      };

      return mockData;

    } catch (error) {
      console.error('Error collecting compliance metrics:', error);
      throw error;
    }
  }

  /**
   * Collect incident metrics
   */
  private async collectIncidentMetrics(): Promise<IncidentMetrics> {
    try {
      const mockData: IncidentMetrics = {
        totalIncidents: 24,
        openIncidents: 3,
        resolvedIncidents: 21,
        criticalIncidents: 1,
        highIncidents: 4,
        mediumIncidents: 12,
        lowIncidents: 7,

        averageTimeToRespond: 2.5, // hours
        averageTimeToResolve: 18.7, // hours
        medianTimeToResolve: 12.0, // hours

        incidentsByCategory: [
          { category: 'Authentication Issues', count: 8, percentage: 33.3 },
          { category: 'Data Breaches', count: 6, percentage: 25.0 },
          { category: 'DDoS Attacks', count: 4, percentage: 16.7 },
          { category: 'Misconfigurations', count: 3, percentage: 12.5 },
          { category: 'Other', count: 3, percentage: 12.5 }
        ],

        incidentsByMonth: [
          { month: '2024-01', count: 6, resolved: 6 },
          { month: '2024-02', count: 5, resolved: 4 },
          { month: '2024-03', count: 7, resolved: 6 },
          { month: '2024-04', count: 6, resolved: 5 }
        ],

        incidentsWithBusinessImpact: 3,
        averageFinancialLoss: 25000, // USD
        customerDataBreached: 0 // No customer data breached
      };

      return mockData;

    } catch (error) {
      console.error('Error collecting incident metrics:', error);
      throw error;
    }
  }

  /**
   * Check for security alerts based on metrics
   */
  private async checkAlerts(metrics: SecurityMetrics): Promise<void> {
    const alerts: SecurityAlert[] = [];

    // Check vulnerability thresholds
    if (metrics.vulnerabilities.criticalVulnerabilities > this.thresholds.criticalVulnerabilities) {
      alerts.push({
        id: `vuln_critical_${Date.now()}`,
        type: 'vulnerability',
        severity: 'critical',
        title: 'Critical Vulnerabilities Detected',
        description: `${metrics.vulnerabilities.criticalVulnerabilities} critical vulnerabilities found`,
        affected: ['Production Environment'],
        impact: 'High risk of security breach',
        recommendations: [
          'Immediate remediation required',
          'Deploy emergency security patches',
          'Monitor for exploitation attempts'
        ],
        createdAt: new Date(),
        status: 'open',
        metadata: {
          vulnerabilityCount: metrics.vulnerabilities.criticalVulnerabilities,
          threshold: this.thresholds.criticalVulnerabilities
        }
      });
    }

    if (metrics.vulnerabilities.highVulnerabilities > this.thresholds.highVulnerabilities) {
      alerts.push({
        id: `vuln_high_${Date.now()}`,
        type: 'vulnerability',
        severity: 'high',
        title: 'High-Risk Vulnerabilities Exceed Threshold',
        description: `${metrics.vulnerabilities.highVulnerabilities} high-risk vulnerabilities found`,
        affected: ['Application Components'],
        impact: 'Increased security risk exposure',
        recommendations: [
          'Prioritize remediation within 30 days',
          'Implement compensating controls',
          'Schedule security review meeting'
        ],
        createdAt: new Date(),
        status: 'open',
        metadata: {
          vulnerabilityCount: metrics.vulnerabilities.highVulnerabilities,
          threshold: this.thresholds.highVulnerabilities
        }
      });
    }

    // Check compliance thresholds
    if (metrics.compliance.overall < (100 - this.thresholds.complianceDrop)) {
      alerts.push({
        id: `compliance_drop_${Date.now()}`,
        type: 'compliance',
        severity: 'high',
        title: 'Compliance Level Dropped',
        description: `Overall compliance dropped to ${metrics.compliance.overall}%`,
        affected: ['Compliance Framework'],
        impact: 'Regulatory compliance risk',
        recommendations: [
          'Review compliance gaps',
          'Implement missing controls',
          'Schedule compliance audit'
        ],
        createdAt: new Date(),
        status: 'open',
        metadata: {
          currentCompliance: metrics.compliance.overall,
          previousCompliance: 92.5 // Mock previous value
        }
      });
    }

    // Store alerts
    this.alerts.push(...alerts);

    // Log alerts
    if (alerts.length > 0) {
      console.log(`🚨 Generated ${alerts.length} security alerts`);
      alerts.forEach(alert => {
        console.log(`  - ${alert.severity.toUpperCase()}: ${alert.title}`);
      });
    }
  }

  /**
   * Generate security report
   */
  async generateReport(type: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SecurityReport> {
    const metrics = await this.collectMetrics();

    const report: SecurityReport = {
      id: `report_${type}_${Date.now()}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Security Report`,
      type,
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      },
      metrics,
      executiveSummary: this.generateExecutiveSummary(metrics),
      keyFindings: this.generateKeyFindings(metrics),
      recommendations: this.generateRecommendations(metrics),
      compliance: this.generateComplianceStatus(metrics),
      generatedAt: new Date(),
      generatedBy: 'Security Metrics Service'
    };

    return report;
  }

  /**
   * Generate executive summary for reports
   */
  private generateExecutiveSummary(metrics: SecurityMetrics): string {
    const criticalVulns = metrics.vulnerabilities.criticalVulnerabilities;
    const highVulns = metrics.vulnerabilities.highVulnerabilities;
    const compliance = metrics.compliance.overall;

    let summary = `Security posture shows ${compliance}% compliance with `;

    if (criticalVulns > 0) {
      summary += `${criticalVulns} critical vulnerabilities requiring immediate attention. `;
    } else if (highVulns > 0) {
      summary += `${highVulns} high-risk vulnerabilities that should be addressed promptly. `;
    } else {
      summary += 'no critical or high-risk vulnerabilities currently detected. ';
    }

    summary += `Test coverage is at ${metrics.testCoverage.securityTestCoverage}% with ${metrics.incidents.openIncidents} open security incidents.`;

    return summary;
  }

  /**
   * Generate key findings for reports
   */
  private generateKeyFindings(metrics: SecurityMetrics): string[] {
    const findings: string[] = [];

    if (metrics.vulnerabilities.criticalVulnerabilities > 0) {
      findings.push(`${metrics.vulnerabilities.criticalVulnerabilities} critical vulnerabilities detected requiring immediate remediation`);
    }

    if (metrics.testCoverage.securityTestCoverage < 90) {
      findings.push(`Security test coverage is below target at ${metrics.testCoverage.securityTestCoverage}%`);
    }

    if (metrics.compliance.overall < 90) {
      findings.push(`Overall compliance dropped to ${metrics.compliance.overall}%`);
    }

    if (metrics.performance.securityOverhead > 5) {
      findings.push(`Security overhead is high at ${metrics.performance.securityOverhead}%`);
    }

    return findings;
  }

  /**
   * Generate recommendations for reports
   */
  private generateRecommendations(metrics: SecurityMetrics): Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
    effort: string;
    owner: string;
  }> {
    const recommendations = [];

    if (metrics.vulnerabilities.criticalVulnerabilities > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Vulnerability Management',
        description: 'Remediate all critical vulnerabilities immediately',
        impact: 'High',
        effort: 'High',
        owner: 'Security Team'
      });
    }

    if (metrics.testCoverage.securityTestCoverage < 90) {
      recommendations.push({
        priority: 'high',
        category: 'Test Coverage',
        description: 'Increase security test coverage to at least 90%',
        impact: 'Medium',
        effort: 'Medium',
        owner: 'QA Team'
      });
    }

    recommendations.push({
      priority: 'medium',
      category: 'Compliance',
      description: 'Review and improve compliance controls',
      impact: 'Medium',
      effort: 'Medium',
      owner: 'Compliance Team'
    });

    return recommendations;
  }

  /**
   * Generate compliance status for reports
   */
  private generateComplianceStatus(metrics: SecurityMetrics): {
    overall: number;
    frameworks: Array<{
      name: string;
      compliance: number;
      status: 'compliant' | 'non-compliant' | 'partial';
    }>;
  } {
    const frameworks = [
      {
        name: 'OWASP Top 10',
        compliance: metrics.compliance.owaspCompliance,
        status: metrics.compliance.owaspCompliance >= 90 ? 'compliant' : 'partial'
      },
      {
        name: 'PCI DSS',
        compliance: metrics.compliance.pciCompliance,
        status: metrics.compliance.pciCompliance >= 90 ? 'compliant' : 'partial'
      },
      {
        name: 'GDPR',
        compliance: metrics.compliance.gdprCompliance,
        status: metrics.compliance.gdprCompliance >= 90 ? 'compliant' : 'partial'
      }
    ];

    return {
      overall: metrics.compliance.overall,
      frameworks
    };
  }

  /**
   * Get current alerts
   */
  getAlerts(): SecurityAlert[] {
    return this.alerts;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(environment?: string): SecurityMetrics[] {
    if (environment) {
      return Array.from(this.metrics.values())
        .filter(m => m.environment === environment);
    }
    return Array.from(this.metrics.values());
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('✅ Alert thresholds updated');
  }

  /**
   * Clear old metrics data (older than specified days)
   */
  clearOldData(days: number = 90): void {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Clear old metrics
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoffDate) {
        this.metrics.delete(key);
      }
    }

    // Clear old alerts
    this.alerts = this.alerts.filter(alert =>
      alert.createdAt > cutoffDate ||
      (alert.status !== 'resolved' && alert.status !== 'closed')
    );

    console.log(`✅ Cleared data older than ${days} days`);
  }
}
