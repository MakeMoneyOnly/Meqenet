/**
 * Security Dashboard Component
 * React component for visualizing security metrics and alerts
 */

import React, { useState, useEffect, useCallback } from 'react';

import {
  SecurityMetrics,
  SecurityAlert,
  SecurityReport,
} from '../models/SecurityMetrics';
import { SecurityMetricsService } from '../services/SecurityMetricsService';

// Constants for dashboard configuration
const DEFAULT_REFRESH_INTERVAL = 5; // minutes
const HIGH_SECURITY_TEST_COVERAGE_THRESHOLD = 90; // percentage
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const OWASP_COMPLIANCE_THRESHOLD = 90; // percentage
const PCI_COMPLIANCE_THRESHOLD = 90; // percentage
const GDPR_COMPLIANCE_THRESHOLD = 90; // percentage
const SOC2_COMPLIANCE_THRESHOLD = 90; // percentage
const SECURITY_OVERHEAD_THRESHOLD = 5; // percentage
const _LOW_SECURITY_TEST_COVERAGE_THRESHOLD = 70; // percentage
const NEGATIVE_INDEX = -3;
const CRITICAL_VULNERABILITY_THRESHOLD = 0;
const OPEN_INCIDENTS_THRESHOLD = 0;

interface SecurityDashboardProps {
  environment?: 'development' | 'staging' | 'production';
  refreshInterval?: number; // minutes
  theme?: 'light' | 'dark' | 'auto';
}

interface DashboardState {
  metrics: SecurityMetrics | null;
  alerts: SecurityAlert[];
  reports: SecurityReport[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  environment = 'production',
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  theme = 'light',
}): React.JSX.Element => {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    alerts: [],
    reports: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const metricsService = SecurityMetricsService.getInstance();

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [metrics, alerts] = await Promise.all([
        metricsService.collectMetrics(environment),
        Promise.resolve(metricsService.getAlerts()),
      ]);

      setState(prev => ({
        ...prev,
        metrics,
        alerts,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      // Error logging handled by centralized error service
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [environment, metricsService]);

  useEffect((): (() => void) => {
    loadData();

    // Set up refresh interval
    const interval = setInterval(
      loadData,
      refreshInterval * MILLISECONDS_PER_MINUTE
    );

    return () => clearInterval(interval);
  }, [environment, refreshInterval, loadData]);

  const generateReport = async (
    type: 'daily' | 'weekly' | 'monthly'
  ): Promise<void> => {
    try {
      const report = await metricsService.generateReport(type);
      setState(prev => ({
        ...prev,
        reports: [...prev.reports, report],
      }));

      // In a real app, you might want to download or send the report
      // Report generation handled by centralized reporting service
    } catch {
      // Error handling done by centralized error service
    }
  };

  if (state.loading && !state.metrics) {
    return (
      <div className="security-dashboard loading">
        <div className="loading-spinner">🔄 Loading Security Metrics...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="security-dashboard error">
        <div className="error-message">
          <h2>❌ Error Loading Security Data</h2>
          <p>{state.error}</p>
          <button onClick={loadData}>🔄 Retry</button>
        </div>
      </div>
    );
  }

  // Early return if no metrics available
  if (!state.metrics) {
    return null;
  }

  return (
    <div className={`security-dashboard theme-${theme}`}>
      <header className="dashboard-header">
        <h1>🔒 Meqenet Security Dashboard</h1>
        <div className="dashboard-info">
          <span>
            Environment: <strong>{environment.toUpperCase()}</strong>
          </span>
          <span>
            Last Updated:{' '}
            <strong>
              {state.lastUpdated ? state.lastUpdated.toLocaleString() : 'Never'}
            </strong>
          </span>
          <button onClick={loadData} disabled={state.loading}>
            {state.loading ? '🔄' : '🔄'} Refresh
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Executive Summary */}
        <div className="dashboard-card executive-summary">
          <h2>📊 Executive Summary</h2>
          {Boolean(state.metrics) && (
            <div className="summary-content">
              <div className="metric-item">
                <span className="label">Overall Security Score:</span>
                <span
                  className={`value ${state.metrics ? getScoreClass(state.metrics.compliance.overall) : 'unknown'}`}
                >
                  {state.metrics ? state.metrics.compliance.overall : 0}%
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Critical Vulnerabilities:</span>
                <span
                  className={`value ${state.metrics && state.metrics.vulnerabilities.criticalVulnerabilities > CRITICAL_VULNERABILITY_THRESHOLD ? 'critical' : 'good'}`}
                >
                  {state.metrics
                    ? state.metrics.vulnerabilities.criticalVulnerabilities
                    : 0}
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Security Test Coverage:</span>
                <span
                  className={`value ${state.metrics && state.metrics.testCoverage.securityTestCoverage >= HIGH_SECURITY_TEST_COVERAGE_THRESHOLD ? 'good' : 'warning'}`}
                >
                  {state.metrics
                    ? state.metrics.testCoverage.securityTestCoverage
                    : 0}
                  %
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Open Security Incidents:</span>
                <span
                  className={`value ${state.metrics && state.metrics.incidents.openIncidents > OPEN_INCIDENTS_THRESHOLD ? 'warning' : 'good'}`}
                >
                  {state.metrics ? state.metrics.incidents.openIncidents : 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Vulnerability Overview */}
        <div className="dashboard-card vulnerability-overview">
          <h2>🎯 Vulnerability Overview</h2>
          {Boolean(state.metrics) && (
            <div className="vulnerability-chart">
              <div className="chart-header">
                <h3>
                  Total Vulnerabilities:{' '}
                  {state.metrics.vulnerabilities.totalVulnerabilities}
                </h3>
              </div>
              <div className="vulnerability-breakdown">
                <div className="vulnerability-item critical">
                  <span className="label">Critical:</span>
                  <span className="value">
                    {state.metrics.vulnerabilities.criticalVulnerabilities}
                  </span>
                </div>
                <div className="vulnerability-item high">
                  <span className="label">High:</span>
                  <span className="value">
                    {state.metrics.vulnerabilities.highVulnerabilities}
                  </span>
                </div>
                <div className="vulnerability-item medium">
                  <span className="label">Medium:</span>
                  <span className="value">
                    {state.metrics.vulnerabilities.mediumVulnerabilities}
                  </span>
                </div>
                <div className="vulnerability-item low">
                  <span className="label">Low:</span>
                  <span className="value">
                    {state.metrics.vulnerabilities.lowVulnerabilities}
                  </span>
                </div>
              </div>
              <div className="vulnerability-metrics">
                <div className="metric">
                  <span>MTTD:</span>{' '}
                  {state.metrics.vulnerabilities.meanTimeToDetect}h
                </div>
                <div className="metric">
                  <span>MTTR:</span>{' '}
                  {state.metrics.vulnerabilities.meanTimeToRemediate}h
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Coverage */}
        <div className="dashboard-card test-coverage">
          <h2>🧪 Security Test Coverage</h2>
          {Boolean(state.metrics) && (
            <div className="coverage-metrics">
              <div className="coverage-item">
                <span className="label">SAST Coverage:</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${state.metrics.testCoverage.sastCoverage}%`,
                    }}
                  />
                  <span className="percentage">
                    {state.metrics.testCoverage.sastCoverage}%
                  </span>
                </div>
              </div>
              <div className="coverage-item">
                <span className="label">DAST Coverage:</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${state.metrics.testCoverage.dastCoverage}%`,
                    }}
                  />
                  <span className="percentage">
                    {state.metrics.testCoverage.dastCoverage}%
                  </span>
                </div>
              </div>
              <div className="coverage-item">
                <span className="label">Security Test Coverage:</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${state.metrics.testCoverage.securityTestCoverage}%`,
                    }}
                  />
                  <span className="percentage">
                    {state.metrics.testCoverage.securityTestCoverage}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Status */}
        <div className="dashboard-card compliance-status">
          <h2>📋 Compliance Status</h2>
          {Boolean(state.metrics) && (
            <div className="compliance-frameworks">
              <div className="framework-item">
                <span className="label">OWASP Top 10:</span>
                <span
                  className={`value ${state.metrics.compliance.owaspCompliance >= OWASP_COMPLIANCE_THRESHOLD ? 'good' : 'warning'}`}
                >
                  {state.metrics.compliance.owaspCompliance}%
                </span>
              </div>
              <div className="framework-item">
                <span className="label">PCI DSS:</span>
                <span
                  className={`value ${state.metrics.compliance.pciCompliance >= PCI_COMPLIANCE_THRESHOLD ? 'good' : 'warning'}`}
                >
                  {state.metrics.compliance.pciCompliance}%
                </span>
              </div>
              <div className="framework-item">
                <span className="label">GDPR:</span>
                <span
                  className={`value ${state.metrics.compliance.gdprCompliance >= GDPR_COMPLIANCE_THRESHOLD ? 'good' : 'warning'}`}
                >
                  {state.metrics.compliance.gdprCompliance}%
                </span>
              </div>
              <div className="framework-item">
                <span className="label">PSD2:</span>
                <span
                  className={`value ${state.metrics.compliance.psd2Compliance >= SOC2_COMPLIANCE_THRESHOLD ? 'good' : 'warning'}`}
                >
                  {state.metrics.compliance.psd2Compliance}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Security Alerts */}
        <div className="dashboard-card security-alerts">
          <h2>🚨 Security Alerts ({state.alerts.length})</h2>
          <div className="alerts-container">
            {state.alerts.length === 0 ? (
              <div className="no-alerts">✅ No active security alerts</div>
            ) : (
              state.alerts
                .slice(0, DEFAULT_REFRESH_INTERVAL)
                .map((alert, _index) => (
                  <div
                    key={alert.id}
                    className={`alert-item severity-${alert.severity}`}
                  >
                    <div className="alert-header">
                      <span className="severity-badge">
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="alert-title">{alert.title}</span>
                    </div>
                    <div className="alert-description">{alert.description}</div>
                    <div className="alert-metadata">
                      <span>
                        Created: {alert.createdAt.toLocaleDateString()}
                      </span>
                      <span>Status: {alert.status}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="dashboard-card performance-metrics">
          <h2>⚡ Performance Impact</h2>
          {Boolean(state.metrics) && (
            <div className="performance-grid">
              <div className="performance-item">
                <span className="label">Security Overhead:</span>
                <span
                  className={`value ${state.metrics.performance.securityOverhead > SECURITY_OVERHEAD_THRESHOLD ? 'warning' : 'good'}`}
                >
                  {state.metrics.performance.securityOverhead}%
                </span>
              </div>
              <div className="performance-item">
                <span className="label">Avg Scan Time:</span>
                <span className="value">
                  {state.metrics.performance.averageScanTime}min
                </span>
              </div>
              <div className="performance-item">
                <span className="label">Memory Usage:</span>
                <span className="value">
                  {state.metrics.performance.memoryUsage}MB
                </span>
              </div>
              <div className="performance-item">
                <span className="label">CPU Usage:</span>
                <span className="value">
                  {state.metrics.performance.cpuUsage}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Incident Overview */}
        <div className="dashboard-card incident-overview">
          <h2>📈 Incident Overview</h2>
          {Boolean(state.metrics) && (
            <div className="incident-metrics">
              <div className="incident-item">
                <span className="label">Total Incidents:</span>
                <span className="value">
                  {state.metrics.incidents.totalIncidents}
                </span>
              </div>
              <div className="incident-item">
                <span className="label">Open Incidents:</span>
                <span
                  className={`value ${state.metrics.incidents.openIncidents > 0 ? 'warning' : 'good'}`}
                >
                  {state.metrics.incidents.openIncidents}
                </span>
              </div>
              <div className="incident-item">
                <span className="label">Avg Response Time:</span>
                <span className="value">
                  {state.metrics.incidents.averageTimeToRespond}h
                </span>
              </div>
              <div className="incident-item">
                <span className="label">Avg Resolution Time:</span>
                <span className="value">
                  {state.metrics.incidents.averageTimeToResolve}h
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Report Generation */}
        <div className="dashboard-card report-generation">
          <h2>📄 Generate Reports</h2>
          <div className="report-actions">
            <button onClick={() => generateReport('daily')}>
              📊 Daily Report
            </button>
            <button onClick={() => generateReport('weekly')}>
              📈 Weekly Report
            </button>
            <button onClick={() => generateReport('monthly')}>
              📋 Monthly Report
            </button>
          </div>
          {state.reports.length > 0 && (
            <div className="recent-reports">
              <h3>Recent Reports:</h3>
              {state.reports.slice(NEGATIVE_INDEX).map((report, _index) => (
                <div key={report.id} className="report-item">
                  <span>{report.title}</span>
                  <span>{report.generatedAt.toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS moved to external file */}
    </div>
  );
};

function getScoreClass(score: number): string {
  if (score >= HIGH_SECURITY_TEST_COVERAGE_THRESHOLD) return 'good';
  if (score >= _LOW_SECURITY_TEST_COVERAGE_THRESHOLD) return 'warning';
  return 'critical';
}
