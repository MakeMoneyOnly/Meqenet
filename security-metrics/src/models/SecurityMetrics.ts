/**
 * Meqenet Security Metrics Data Models
 * Comprehensive security metrics tracking for fintech-grade applications
 */

export interface SecurityMetrics {
  // Vulnerability Metrics
  vulnerabilities: VulnerabilityMetrics;

  // Test Coverage Metrics
  testCoverage: TestCoverageMetrics;

  // Performance Metrics
  performance: PerformanceMetrics;

  // Compliance Metrics
  compliance: ComplianceMetrics;

  // Incident Response Metrics
  incidents: IncidentMetrics;

  // Timestamp and metadata
  timestamp: Date;
  period: 'daily' | 'weekly' | 'monthly';
  environment: 'development' | 'staging' | 'production';
}

export interface VulnerabilityMetrics {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  infoVulnerabilities: number;

  // Vulnerability trends
  newVulnerabilities: number;
  resolvedVulnerabilities: number;
  openVulnerabilities: number;

  // Mean Time metrics
  meanTimeToDetect: number; // MTTD in hours
  meanTimeToRemediate: number; // MTTR in hours

  // Vulnerability age distribution
  vulnerabilitiesByAge: {
    '0-7days': number;
    '8-30days': number;
    '31-90days': number;
    '90+days': number;
  };

  // Top vulnerability categories
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export interface TestCoverageMetrics {
  // Static Application Security Testing (SAST)
  sastCoverage: number; // Percentage of code analyzed by SAST
  sastLinesAnalyzed: number;
  sastIssuesFound: number;
  sastCriticalIssues: number;

  // Dynamic Application Security Testing (DAST)
  dastCoverage: number; // Percentage of APIs/endpoints tested
  dastTestsRun: number;
  dastIssuesFound: number;
  dastCriticalIssues: number;

  // Security Test Case Coverage
  securityTestCases: number;
  securityTestCasesExecuted: number;
  securityTestCoverage: number; // Percentage

  // Mobile Application Security Testing (MAST)
  mastCoverage: number;
  mastTestsRun: number;
  mastIssuesFound: number;

  // Dependency Security Testing
  dependencyTestsRun: number;
  dependencyVulnerabilities: number;
  dependencyCoverage: number;
}

export interface PerformanceMetrics {
  // Security Scan Performance
  averageScanTime: number; // in minutes
  scanSuccessRate: number; // percentage
  scanFailureRate: number; // percentage

  // System Performance Impact
  securityOverhead: number; // percentage performance impact
  memoryUsage: number; // MB
  cpuUsage: number; // percentage

  // Response Times
  averageResponseTime: number; // milliseconds
  percentile95ResponseTime: number; // milliseconds
  percentile99ResponseTime: number; // milliseconds

  // Resource Utilization
  peakMemoryUsage: number;
  peakCpuUsage: number;
  concurrentUsersSupported: number;
}

export interface ComplianceMetrics {
  // OWASP Top 10 Coverage
  owaspCompliance: number; // percentage
  owaspControlsImplemented: number;
  owaspTotalControls: number;

  // PCI DSS Compliance
  pciCompliance: number; // percentage
  pciRequirementsMet: number;
  pciTotalRequirements: number;

  // GDPR Compliance
  gdprCompliance: number; // percentage
  gdprControlsImplemented: number;
  gdprTotalControls: number;

  // PSD2 Compliance (Payment Services Directive)
  psd2Compliance: number; // percentage
  psd2RequirementsMet: number;
  psd2TotalRequirements: number;

  // ISO 27001 Compliance
  iso27001Compliance: number; // percentage
  iso27001ControlsImplemented: number;
  iso27001TotalControls: number;

  // Custom Compliance Frameworks
  customComplianceFrameworks: Array<{
    name: string;
    compliance: number;
    requirementsMet: number;
    totalRequirements: number;
  }>;
}

export interface IncidentMetrics {
  // Incident Statistics
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  lowIncidents: number;

  // Incident Response Times
  averageTimeToRespond: number; // hours
  averageTimeToResolve: number; // hours
  medianTimeToResolve: number; // hours

  // Incident Categories
  incidentsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;

  // Incident Trends
  incidentsByMonth: Array<{
    month: string;
    count: number;
    resolved: number;
  }>;

  // Business Impact
  incidentsWithBusinessImpact: number;
  averageFinancialLoss: number; // USD
  customerDataBreached: number; // number of customers affected
}

export interface SecurityDashboardConfig {
  // Dashboard Settings
  refreshInterval: number; // minutes
  alertThresholds: AlertThresholds;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;

  // Display Settings
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'list' | 'compact';
  timezone: string;

  // Report Settings
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  reportRecipients: string[];
  reportFormat: 'html' | 'pdf' | 'json';
}

export interface AlertThresholds {
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  scanFailureRate: number; // percentage
  responseTimeDegradation: number; // percentage
  complianceDrop: number; // percentage points
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    smtp: string;
    recipients: string[];
  };
  slack: {
    enabled: boolean;
    webhook: string;
    channel: string;
  };
  teams: {
    enabled: boolean;
    webhook: string;
  };
  pagerduty: {
    enabled: boolean;
    integrationKey: string;
  };
}

export interface IntegrationSettings {
  jira: {
    enabled: boolean;
    url: string;
    project: string;
    issueType: string;
  };
  github: {
    enabled: boolean;
    repository: string;
    labels: string[];
  };
  gitlab: {
    enabled: boolean;
    url: string;
    project: string;
    labels: string[];
  };
}

export interface SecurityReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  period: {
    start: Date;
    end: Date;
  };
  metrics: SecurityMetrics;
  executiveSummary: string;
  keyFindings: string[];
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
    effort: string;
    owner: string;
  }>;
  compliance: {
    overall: number;
    frameworks: Array<{
      name: string;
      compliance: number;
      status: 'compliant' | 'non-compliant' | 'partial';
    }>;
  };
  generatedAt: Date;
  generatedBy: string;
}

export interface SecurityAlert {
  id: string;
  type: 'vulnerability' | 'compliance' | 'performance' | 'incident';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  affected: string[];
  impact: string;
  recommendations: string[];
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  assignee?: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  metadata: Record<string, any>;
}
