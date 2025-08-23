# 🔒 Meqenet Security Metrics Dashboard

A comprehensive security metrics dashboard and monitoring system for the Meqenet fintech platform.
This module provides real-time security posture monitoring, vulnerability tracking, compliance
reporting, and automated security alerting.

## 🚀 Features

### 📊 Security Metrics Collection

- **Vulnerability Metrics**: Track critical, high, medium, and low-risk vulnerabilities
- **Test Coverage Metrics**: Monitor SAST, DAST, and security test coverage
- **Performance Metrics**: Track security overhead and system performance impact
- **Compliance Metrics**: Monitor OWASP, PCI DSS, GDPR, and PSD2 compliance
- **Incident Metrics**: Track security incidents and response times

### 🎯 Security Alerting System

- **Real-time Alerts**: Automated alerts for critical security issues
- **Customizable Thresholds**: Configurable alert thresholds for different metrics
- **Multi-channel Notifications**: Email, Slack, Teams, and PagerDuty integration
- **Alert Management**: Alert acknowledgment, resolution tracking, and history

### 📈 Dashboard Visualization

- **Interactive Dashboard**: Real-time security metrics visualization
- **Compliance Status**: Visual compliance status across frameworks
- **Vulnerability Overview**: Detailed vulnerability breakdown and trends
- **Performance Monitoring**: Security impact on system performance
- **Incident Tracking**: Security incident overview and management

### 📋 Automated Reporting

- **Daily Reports**: Automated daily security status reports
- **Weekly Reports**: Comprehensive weekly security analysis
- **Monthly Reports**: Detailed monthly compliance and security reports
- **Custom Reports**: Generate reports for specific time periods

## 🛠️ Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- React 18.0.0 or higher

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/meqenet/security-metrics.git
   cd security-metrics
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the module:**

   ```bash
   npm run build
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📖 Usage

### Basic Setup

```typescript
import { SecurityDashboard, SecurityMetricsService } from '@meqenet/security-metrics';

// Initialize the security metrics service
const metricsService = SecurityMetricsService.getInstance();

// Configure alert thresholds
metricsService.updateThresholds({
  criticalVulnerabilities: 0,
  highVulnerabilities: 5,
  scanFailureRate: 10,
  complianceDrop: 5
});

// Use the dashboard component
function App() {
  return (
    <div>
      <SecurityDashboard
        environment="production"
        refreshInterval={5}
        theme="light"
      />
    </div>
  );
}
```

### Advanced Configuration

```typescript
// Custom security metrics collection
const customMetrics = await metricsService.collectMetrics('production');

// Generate security reports
const dailyReport = await metricsService.generateReport('daily');
const weeklyReport = await metricsService.generateReport('weekly');

// Get current security alerts
const alerts = metricsService.getAlerts();

// Get metrics history
const history = metricsService.getMetricsHistory('production');

// Clear old data (older than 90 days)
metricsService.clearOldData(90);
```

### Integration with CI/CD

```yaml
# .github/workflows/security-monitoring.yml
name: 🔒 Security Monitoring
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  push:
    branches: [main, develop]

jobs:
  security-monitoring:
    runs-on: ubuntu-latest
    steps:
      - name: 📊 Collect Security Metrics
        run: |
          # Run security scans and collect metrics
          npm run security:sast
          npm run security:dast
          npm run security:dependency-scan

      - name: 📈 Update Security Dashboard
        run: |
          # Update metrics in dashboard
          npm run update-security-metrics

      - name: 🚨 Check Security Alerts
        run: |
          # Check for new security alerts
          npm run check-security-alerts

      - name: 📧 Send Security Report
        if: always()
        run: |
          # Generate and send security report
          npm run generate-security-report
```

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
SECURITY_METRICS_DB_HOST=localhost
SECURITY_METRICS_DB_PORT=5432
SECURITY_METRICS_DB_NAME=security_metrics
SECURITY_METRICS_DB_USER=security_user
SECURITY_METRICS_DB_PASSWORD=secure_password

# External API Keys
OWASP_API_KEY=your_owasp_api_key
NVD_API_KEY=your_nvd_api_key

# Notification Settings
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_key

# Security Thresholds
CRITICAL_VULNERABILITY_THRESHOLD=0
HIGH_VULNERABILITY_THRESHOLD=5
COMPLIANCE_DROP_THRESHOLD=5
```

### Configuration File

```typescript
// security-config.ts
export const securityConfig = {
  // Alert thresholds
  thresholds: {
    criticalVulnerabilities: 0,
    highVulnerabilities: 5,
    scanFailureRate: 10,
    responseTimeDegradation: 20,
    complianceDrop: 5,
  },

  // Notification settings
  notifications: {
    email: {
      enabled: true,
      smtp: 'smtp.gmail.com',
      recipients: ['security@meqenet.com'],
    },
    slack: {
      enabled: true,
      webhook: 'https://hooks.slack.com/...',
      channel: '#security-alerts',
    },
  },

  // Integration settings
  integrations: {
    jira: {
      enabled: true,
      url: 'https://meqenet.atlassian.net',
      project: 'SEC',
    },
  },

  // Report settings
  reports: {
    frequency: 'daily',
    format: 'html',
    retention: 90, // days
  },
};
```

## 📊 API Reference

### SecurityMetricsService

#### Methods

- `collectMetrics(environment)`: Collect security metrics for specified environment
- `generateReport(type)`: Generate security report (daily/weekly/monthly)
- `getAlerts()`: Get current security alerts
- `updateThresholds(thresholds)`: Update alert thresholds
- `clearOldData(days)`: Clear metrics older than specified days

### SecurityDashboard Component

#### Props

- `environment`: Target environment ('development' | 'staging' | 'production')
- `refreshInterval`: Dashboard refresh interval in minutes (default: 5)
- `theme`: Dashboard theme ('light' | 'dark' | 'auto')

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing Tests

```typescript
import { SecurityMetricsService } from '../src/services/SecurityMetricsService';

describe('SecurityMetricsService', () => {
  let metricsService: SecurityMetricsService;

  beforeEach(() => {
    metricsService = SecurityMetricsService.getInstance();
  });

  test('should collect vulnerability metrics', async () => {
    const metrics = await metricsService.collectMetrics('test');
    expect(metrics.vulnerabilities).toBeDefined();
    expect(metrics.vulnerabilities.totalVulnerabilities).toBeGreaterThanOrEqual(0);
  });

  test('should generate security alerts', async () => {
    const metrics = await metricsService.collectMetrics('test');
    const alerts = metricsService.getAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📧 Email: security@meqenet.com
- 💬 Slack: #security-metrics
- 📖 Documentation: [Meqenet Security Docs](https://docs.meqenet.com/security)

## 🔄 Changelog

### Version 1.0.0

- Initial release
- Security metrics collection
- Dashboard visualization
- Alert management system
- Automated reporting

---

**Built with ❤️ by the Meqenet Security Team**

_Empowering fintech security through comprehensive metrics and monitoring_
