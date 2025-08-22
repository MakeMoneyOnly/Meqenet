/**
 * Security Dashboard Component
 * React component for visualizing security metrics and alerts
 */

import React, { useState, useEffect } from 'react';
import {
  SecurityMetrics,
  SecurityAlert,
  SecurityReport
} from '../models/SecurityMetrics';
import { SecurityMetricsService } from '../services/SecurityMetricsService';

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
  refreshInterval = 5,
  theme = 'light'
}) => {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    alerts: [],
    reports: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const metricsService = SecurityMetricsService.getInstance();

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [metrics, alerts] = await Promise.all([
        metricsService.collectMetrics(environment),
        Promise.resolve(metricsService.getAlerts())
      ]);

      setState(prev => ({
        ...prev,
        metrics,
        alerts,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error loading security data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  useEffect(() => {
    loadData();

    // Set up refresh interval
    const interval = setInterval(loadData, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [environment, refreshInterval]);

  const generateReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    try {
      const report = await metricsService.generateReport(type);
      setState(prev => ({
        ...prev,
        reports: [...prev.reports, report]
      }));

      // In a real app, you might want to download or send the report
      console.log(`📊 ${type} security report generated:`, report);
    } catch (error) {
      console.error('Error generating report:', error);
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

  return (
    <div className={`security-dashboard theme-${theme}`}>
      <header className="dashboard-header">
        <h1>🔒 Meqenet Security Dashboard</h1>
        <div className="dashboard-info">
          <span>Environment: <strong>{environment.toUpperCase()}</strong></span>
          <span>Last Updated: <strong>{state.lastUpdated?.toLocaleString() || 'Never'}</strong></span>
          <button onClick={loadData} disabled={state.loading}>
            {state.loading ? '🔄' : '🔄'} Refresh
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Executive Summary */}
        <div className="dashboard-card executive-summary">
          <h2>📊 Executive Summary</h2>
          {state.metrics && (
            <div className="summary-content">
              <div className="metric-item">
                <span className="label">Overall Security Score:</span>
                <span className={`value ${getScoreClass(state.metrics.compliance.overall)}`}>
                  {state.metrics.compliance.overall}%
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Critical Vulnerabilities:</span>
                <span className={`value ${state.metrics.vulnerabilities.criticalVulnerabilities > 0 ? 'critical' : 'good'}`}>
                  {state.metrics.vulnerabilities.criticalVulnerabilities}
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Security Test Coverage:</span>
                <span className={`value ${state.metrics.testCoverage.securityTestCoverage >= 90 ? 'good' : 'warning'}`}>
                  {state.metrics.testCoverage.securityTestCoverage}%
                </span>
              </div>
              <div className="metric-item">
                <span className="label">Open Security Incidents:</span>
                <span className={`value ${state.metrics.incidents.openIncidents > 0 ? 'warning' : 'good'}`}>
                  {state.metrics.incidents.openIncidents}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Vulnerability Overview */}
        <div className="dashboard-card vulnerability-overview">
          <h2>🎯 Vulnerability Overview</h2>
          {state.metrics && (
            <div className="vulnerability-chart">
              <div className="chart-header">
                <h3>Total Vulnerabilities: {state.metrics.vulnerabilities.totalVulnerabilities}</h3>
              </div>
              <div className="vulnerability-breakdown">
                <div className="vulnerability-item critical">
                  <span className="label">Critical:</span>
                  <span className="value">{state.metrics.vulnerabilities.criticalVulnerabilities}</span>
                </div>
                <div className="vulnerability-item high">
                  <span className="label">High:</span>
                  <span className="value">{state.metrics.vulnerabilities.highVulnerabilities}</span>
                </div>
                <div className="vulnerability-item medium">
                  <span className="label">Medium:</span>
                  <span className="value">{state.metrics.vulnerabilities.mediumVulnerabilities}</span>
                </div>
                <div className="vulnerability-item low">
                  <span className="label">Low:</span>
                  <span className="value">{state.metrics.vulnerabilities.lowVulnerabilities}</span>
                </div>
              </div>
              <div className="vulnerability-metrics">
                <div className="metric">
                  <span>MTTD:</span> {state.metrics.vulnerabilities.meanTimeToDetect}h
                </div>
                <div className="metric">
                  <span>MTTR:</span> {state.metrics.vulnerabilities.meanTimeToRemediate}h
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Coverage */}
        <div className="dashboard-card test-coverage">
          <h2>🧪 Security Test Coverage</h2>
          {state.metrics && (
            <div className="coverage-metrics">
              <div className="coverage-item">
                <span className="label">SAST Coverage:</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{ width: `${state.metrics.testCoverage.sastCoverage}%` }}
                  ></div>
                  <span className="percentage">{state.metrics.testCoverage.sastCoverage}%</span>
                </div>
              </div>
              <div className="coverage-item">
                <span className="label">DAST Coverage:</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{ width: `${state.metrics.testCoverage.dastCoverage}%` }}
                  ></div>
                  <span className="percentage">{state.metrics.testCoverage.dastCoverage}%</span>
                </div>
              </div>
              <div className="coverage-item">
                <span className="label">Security Test Coverage:</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{ width: `${state.metrics.testCoverage.securityTestCoverage}%` }}
                  ></div>
                  <span className="percentage">{state.metrics.testCoverage.securityTestCoverage}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Status */}
        <div className="dashboard-card compliance-status">
          <h2>📋 Compliance Status</h2>
          {state.metrics && (
            <div className="compliance-frameworks">
              <div className="framework-item">
                <span className="label">OWASP Top 10:</span>
                <span className={`value ${state.metrics.compliance.owaspCompliance >= 90 ? 'good' : 'warning'}`}>
                  {state.metrics.compliance.owaspCompliance}%
                </span>
              </div>
              <div className="framework-item">
                <span className="label">PCI DSS:</span>
                <span className={`value ${state.metrics.compliance.pciCompliance >= 90 ? 'good' : 'warning'}`}>
                  {state.metrics.compliance.pciCompliance}%
                </span>
              </div>
              <div className="framework-item">
                <span className="label">GDPR:</span>
                <span className={`value ${state.metrics.compliance.gdprCompliance >= 90 ? 'good' : 'warning'}`}>
                  {state.metrics.compliance.gdprCompliance}%
                </span>
              </div>
              <div className="framework-item">
                <span className="label">PSD2:</span>
                <span className={`value ${state.metrics.compliance.psd2Compliance >= 90 ? 'good' : 'warning'}`}>
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
              state.alerts.slice(0, 5).map((alert, index) => (
                <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-header">
                    <span className="severity-badge">{alert.severity.toUpperCase()}</span>
                    <span className="alert-title">{alert.title}</span>
                  </div>
                  <div className="alert-description">{alert.description}</div>
                  <div className="alert-metadata">
                    <span>Created: {alert.createdAt.toLocaleDateString()}</span>
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
          {state.metrics && (
            <div className="performance-grid">
              <div className="performance-item">
                <span className="label">Security Overhead:</span>
                <span className={`value ${state.metrics.performance.securityOverhead > 5 ? 'warning' : 'good'}`}>
                  {state.metrics.performance.securityOverhead}%
                </span>
              </div>
              <div className="performance-item">
                <span className="label">Avg Scan Time:</span>
                <span className="value">{state.metrics.performance.averageScanTime}min</span>
              </div>
              <div className="performance-item">
                <span className="label">Memory Usage:</span>
                <span className="value">{state.metrics.performance.memoryUsage}MB</span>
              </div>
              <div className="performance-item">
                <span className="label">CPU Usage:</span>
                <span className="value">{state.metrics.performance.cpuUsage}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Incident Overview */}
        <div className="dashboard-card incident-overview">
          <h2>📈 Incident Overview</h2>
          {state.metrics && (
            <div className="incident-metrics">
              <div className="incident-item">
                <span className="label">Total Incidents:</span>
                <span className="value">{state.metrics.incidents.totalIncidents}</span>
              </div>
              <div className="incident-item">
                <span className="label">Open Incidents:</span>
                <span className={`value ${state.metrics.incidents.openIncidents > 0 ? 'warning' : 'good'}`}>
                  {state.metrics.incidents.openIncidents}
                </span>
              </div>
              <div className="incident-item">
                <span className="label">Avg Response Time:</span>
                <span className="value">{state.metrics.incidents.averageTimeToRespond}h</span>
              </div>
              <div className="incident-item">
                <span className="label">Avg Resolution Time:</span>
                <span className="value">{state.metrics.incidents.averageTimeToResolve}h</span>
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
              {state.reports.slice(-3).map((report, index) => (
                <div key={report.id} className="report-item">
                  <span>{report.title}</span>
                  <span>{report.generatedAt.toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .security-dashboard {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .theme-dark {
          background-color: #1a1a1a;
          color: #ffffff;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .dashboard-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .dashboard-info span {
          font-size: 0.9em;
          color: #6c757d;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .dashboard-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }

        .theme-dark .dashboard-card {
          background: #2d2d2d;
          color: #ffffff;
          border-color: #404040;
        }

        .loading-spinner {
          text-align: center;
          padding: 50px;
          font-size: 1.2em;
        }

        .error-message {
          text-align: center;
          padding: 50px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
        }

        .summary-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .value.critical { color: #dc3545; font-weight: bold; }
        .value.warning { color: #fd7e14; font-weight: bold; }
        .value.good { color: #28a745; font-weight: bold; }

        .vulnerability-breakdown {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 15px 0;
        }

        .vulnerability-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 4px;
          background: #f8f9fa;
        }

        .vulnerability-item.critical { background: #f8d7da; }
        .vulnerability-item.high { background: #fff3cd; }
        .vulnerability-item.medium { background: #d1ecf1; }
        .vulnerability-item.low { background: #d4edda; }

        .coverage-metrics {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .coverage-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .progress-bar {
          height: 20px;
          background: #e9ecef;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
        }

        .progress {
          height: 100%;
          background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .percentage {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.8em;
          font-weight: bold;
          color: #000;
        }

        .alerts-container {
          max-height: 300px;
          overflow-y: auto;
        }

        .alert-item {
          padding: 12px;
          margin: 8px 0;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .severity-critical { border-left-color: #dc3545; background: #f8d7da; }
        .severity-high { border-left-color: #fd7e14; background: #fff3cd; }
        .severity-medium { border-left-color: #ffc107; background: #fff8e1; }
        .severity-low { border-left-color: #28a745; background: #d4edda; }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .severity-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: bold;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .performance-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .report-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .report-actions button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .report-actions button:hover {
          background: #0056b3;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .dashboard-info {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

function getScoreClass(score: number): string {
  if (score >= 90) return 'good';
  if (score >= 70) return 'warning';
  return 'critical';
}
