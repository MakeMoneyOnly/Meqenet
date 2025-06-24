# Monitoring & Logging Architecture (Meqenet BNPL Platform)

## Overview

This document outlines the monitoring and logging strategy for the Meqenet comprehensive BNPL
financial ecosystem, designed for modern FinTech operations. It describes our approach to
observability, alerting, and incident response across our microservices, ensuring we maintain high
reliability, performance, and **security visibility in line with enterprise FinTech standards, NBE
guidelines, Ethiopian data protection laws, and our Microservice Architecture.**

The monitoring strategy covers the complete ecosystem of services:

- **Core Services**: Payments, Authentication, Users, KYC
- **Business Services**: Marketplace, Rewards, Premium Features
- **Supporting Services**: Virtual Cards, QR Payments, Analytics & AI
- **Cross-Service**: API Gateway, Service Mesh, and inter-service communication health.

> **Related Documentation:**
>
> - [Infrastructure](./24-Infrastructure.md): Infrastructure components being monitored
> - [Deployment](./23-Deployment.md): Deployment procedures including monitoring setup
> - [Security](../Stage%201%20-%20Foundation/07-Security.md): Security standards and NBE compliance
> - [Testing Guidelines](../Stage%202%20-Development/22-Testing_Guidelines.md): Pre-deployment
>   testing strategies
> - `.cursorrules`: Core security and quality coding standards for the project.

## 1. Monitoring Philosophy

Our monitoring strategy is built on the following principles:

- **Financial Integrity Focus:** Prioritize monitoring of payment processing via Ethiopian providers
  (Telebirr, etc.), ETB transaction flows, and financial data consistency.
- **Business-Oriented:** Focus on metrics that impact user experience and business outcomes
- **Proactive Detection:** Identify issues before they affect users
- **Comprehensive Coverage:** Monitor all layers of the stack (infrastructure, services, business
  logic)
- **Actionable Alerts:** Alert on conditions that require human intervention, with clear remediation
  steps
- **Compliance Adherence:** Ensure monitoring practices meet NBE requirements, Ethiopian data
  protection laws, and relevant financial regulations.
- **Continuous Improvement:** Regularly review and refine monitoring based on incidents and changing
  needs

## 2. Monitoring Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Monitoring Stack                            │
│                                                                      │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│ │            │  │            │  │            │  │            │      │
│ │ Prometheus │◄─┤  Grafana   │  │   Sentry   │  │  Datadog   │      │
│ │  Metrics   │  │ Dashboards │  │Error Track │  │    APM     │      │
│ │            │  │            │  │            │  │            │      │
│ └─────┬──────┘  └────────────┘  └──────┬─────┘  └──────┬─────┘      │
│       │                               │               │             │
│       │                               │               │             │
│       ▼                               ▼               ▼             │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│ │            │  │            │  │            │  │            │      │
│ │ AlertManager│ │ CloudWatch │  │  Slack     │  │ PagerDuty  │      │
│ │  Alerting   │ │ AWS Logs   │  │Notifications│ │  Oncall    │      │
│ │            │  │            │  │            │  │            │      │
│ └────────────┘  └────────────┘  └────────────┘  └────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Monitoring Services

- **Infrastructure Monitoring:**
  - AWS CloudWatch: Native AWS service monitoring
  - Prometheus: Kubernetes and application metrics
  - Node Exporter: Host-level metrics

- **Application Performance Monitoring (APM):**
  - Datadog APM: End-to-end request tracing
  - **Distributed tracing with OpenTelemetry is mandatory** to trace requests as they travel across
    multiple microservices.

- **Error Tracking:**
  - Sentry: Real-time error tracking and alerting
  - Capture frontend, mobile, and backend exceptions

- **Synthetic Monitoring:**
  - Regular API endpoint checks (from Ethiopian perspective if possible).
  - Critical financial transaction flow simulations using ETB and Ethiopian providers.
  - Validation of Telebirr/HelloCash/etc. payment processing integration health.
  - _Tools:_ AWS CloudWatch Synthetics / Datadog Synthetics.

- **Security Monitoring:**
  - AWS GuardDuty: Threat detection.
  - AWS Security Hub: Security posture management (check for NBE compliance pack).
  - WAF monitoring for attack patterns (considering regional threats).
  - Fraud detection system monitoring (tuned for Ethiopian patterns).

- **Compliance Monitoring:**
  - NBE compliance metrics (e.g., data handling checks, uptime of critical services).
  - Data access audit logs (aligned with Ethiopian data privacy laws).

- **Business Metrics:**
  - Custom application metrics for business KPIs in the Ethiopian market.
  - Transaction volumes and values (ETB).
  - Credit utilization metrics (alternative data based).
  - Default and delinquency rates (Ethiopian user base).

## 3. Key Metrics to Monitor (Ethiopian Context)

### Infrastructure Metrics

- **Kubernetes Cluster (in chosen AWS Region):**
  - Node CPU/Memory utilization
  - Pod resource usage and requests/limits ratio
  - Pending/Failed pods
  - Deployment status
  - Node health

- **Database (PostgreSQL):**
  - Connection count (active, idle, max)
  - Query performance (slow query count, execution time for ETB transactions)
  - Transaction rates (ETB)
  - Replication lag (if using read replicas)
  - Storage usage and growth (consider NBE retention impact)
  - Cache hit ratio

- **Caching (Redis):**
  - Memory usage
  - Eviction rate
  - Command latency
  - Hit/miss ratio
  - Connection count

- **Load Balancer:**
  - Request count
  - Latency
  - Error rate (4xx, 5xx)
  - Healthy host count

### Application Metrics

- **API Performance:**
  - Request rate (overall and per-service)
  - Response time (p50, p90, p99 - measured for both the API gateway and internal service-to-service
    calls)
  - Error rate (by endpoint and by service)
  - **Inter-Service Communication Latency:** Latency for gRPC/event bus calls between services.
  - Concurrent requests

- **Transaction Processing (Ethiopian Providers):**
  - Transaction volume (ETB).
  - Transaction success rate by provider (Telebirr, HelloCash, etc.).
  - Payment processing time per provider.
  - Authorization success rate per provider.
  - Declined transaction rate by reason (provider-specific codes).

- **Background Jobs:**
  - Queue length
  - Processing time
  - Error/retry rate
  - Success rate

- **AI Risk Assessment (Alternative Data):**
  - API call volume to assessment service.
  - Response time from assessment service.
  - Approval/decline rates based on alternative data scoring.
  - Model performance metrics (fairness, accuracy for Ethiopian context).

- **Mobile App Performance (Ethiopian Users/Networks):**
  - App startup time (on typical Ethiopian devices).
  - Screen transition time.
  - API call success rate (under simulated Ethiopian network conditions).
  - Crash-free user percentage (segmented by region/device if possible).
  - Network error rate (higher threshold might be needed for Ethiopia).

- **Frontend Performance:**
  - Time to First Byte (TTFB)
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - First Input Delay (FID)

### Business Metrics (Ethiopian Market)

- **User Activity:**
  - Daily/Monthly Active Users (in Ethiopia).
  - User acquisition rate (Ethiopia).
  - Onboarding completion rate (including KYC with Fayda/etc.).
  - Average ETB transactions per user.

- **Financial Metrics (ETB):**
  - Total Transaction Volume (TTV) in ETB.
  - Average Transaction Value (ATV) in ETB.
  - Revenue (merchant fees in ETB).
  - Default rate (for Ethiopian portfolio).
  - Delinquency rate by payment term (Ethiopian portfolio).

- **Credit Performance (Alternative Data Based):**
  - Average credit limit (ETB).
  - Credit utilization rate.
  - Application approval rate (Ethiopian applicants).
  - Risk score distribution (based on alternative data model).

## 4. Alerting Strategy

### Alert Classification

- **P0 - Critical:**
  - Payment processing system failure
  - Database unavailability
  - Security breach
  - Data loss or corruption
  - _Response Time:_ Immediate (24/7)
  - _Notification:_ PagerDuty + Slack

- **P1 - High:**
  - Degraded payment processing
  - Elevated transaction failure rate
  - Significant performance degradation affecting users
  - Impending resource exhaustion
  - _Response Time:_ Within 30 minutes (24/7)
  - _Notification:_ PagerDuty + Slack

- **P2 - Medium:**
  - Minor performance issues
  - Non-critical component failures with redundancy
  - Approaching warning thresholds
  - Increased error rates below critical threshold
  - _Response Time:_ Within 4 hours (business hours)
  - _Notification:_ Slack

- **P3 - Low:**
  - Informational alerts
  - Minor anomalies requiring investigation
  - Non-urgent maintenance needs
  - _Response Time:_ Within a business day
  - _Notification:_ Slack or email digest

### Alert Configuration Examples

- **Payment Processing Error Rate Alert:**

  ```yaml
  groups:
    - name: payment-processing-alerts
      rules:
        - alert: PaymentProcessingErrorRateHigh
          expr:
            sum(rate(payment_processing_errors_total{environment="production"}[5m])) /
            sum(rate(payment_processing_total{environment="production"}[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: 'Payment processing error rate above 5%'
            description:
              'Payment processing error rate is {{ $value | humanizePercentage }} over the last 5
              minutes'
            runbook_url: 'https://wiki.meqenet.com/runbooks/payment-processing-errors'
  ```

- **API Error Rate Alert:**
  ```yaml
  groups:
    - name: api-alerts
      rules:
        - alert: APIErrorRateHigh
          expr:
            sum(rate(http_requests_total{status=~"5..",service="api",environment="production"}[5m]))
            / sum(rate(http_requests_total{service="api",environment="production"}[5m])) > 0.01
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: 'API error rate above 1%'
            description:
              'API error rate is {{ $value | humanizePercentage }} over the last 5 minutes'
            runbook_url: 'https://wiki.meqenet.com/runbooks/api-errors'
  ```

## 5. Logging Strategy (NBE & Ethiopian Law Compliance)

### Log Levels and Usage

- **ERROR:** System errors requiring immediate attention
- **WARN:** Potential issues that should be reviewed
- **INFO:** Normal operational events
- **DEBUG:** Detailed information for troubleshooting

### Log Data Categories

- **System Logs:** Infrastructure and platform components (EKS, RDS, etc.).
- **Application Logs:** Logs from each individual microservice.
- **API Gateway Logs:** Detailed logs of all incoming requests and outgoing responses.
- **Transaction Logs:** Financial transaction details (ETB amounts, provider used - Telebirr, etc.).
- **Security Logs:** Authentication, authorization, data access (esp. PII/Fayda data).
- **Audit Logs:** User and system actions affecting financial data or compliance settings (NBE
  focus).

- **Correlation ID:** **Every request** that enters the system via the API Gateway is assigned a
  unique `Correlation-ID`. This ID **must be propagated** to all subsequent downstream service calls
  (gRPC) and asynchronous events (Kafka messages). All logs related to a single request must include
  this `Correlation-ID`, enabling us to trace the full lifecycle of a request across the distributed
  system.

### Sensitive Data Handling (Ethiopian Data Protection)

- **PII Protection:**
  - Mask/tokenize sensitive user information (Fayda numbers, full names, specific addresses)
    according to Ethiopian data protection laws.
  - No sensitive payment identifiers (e.g., full phone number for Telebirr if considered sensitive)
    unless necessary and secured.
  - No authentication credentials.
  - Compliance with NBE data security directives and Ethiopian data privacy laws.

- **Log Field Sanitization:**

  ```javascript
  // Example log sanitization function
  function sanitizeLogData(data) {
    const sanitized = { ...data };
    if (sanitized.cardNumber) {
      sanitized.cardNumber = `xxxx-xxxx-xxxx-${sanitized.cardNumber.slice(-4)}`;
    }
    if (sanitized.ssn) {
      sanitized.ssn = 'xxx-xx-xxxx';
    }
    return sanitized;
  }

  logger.info('Payment processed', sanitizeLogData(paymentData));
  ```

- **Example of logging with a correlation ID**

  ```javascript
  // Example of logging with a correlation ID
  function logWithCorrelation(correlationId, level, message, data) {
    const logObject = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      correlationId: correlationId,
      service: process.env.SERVICE_NAME || 'unknown-service',
      ...sanitizeLogData(data),
    };
    console.log(JSON.stringify(logObject));
  }

  // In an Express/NestJS middleware:
  // const correlationId = req.headers['x-correlation-id'];
  // logWithCorrelation(correlationId, 'info', 'Processing request', { path: req.path });
  ```

### Centralized Logging Architecture

- **Collection:** Fluent Bit/Fluentd agents on nodes
- **Transport:** Secure, authenticated connections
- **Storage:** Elasticsearch or AWS CloudWatch Logs (ensure storage location complies with NBE data
  residency rules).
- **Querying/Analysis:** AWS CloudWatch Log Insights / Datadog Log Management.
- **Retention:**
  - Transaction logs (ETB): Align with NBE requirements (e.g., 7+ years).
  - Security logs: Align with NBE and local legal requirements.
  - Audit Logs (NBE Compliance): Retain per NBE directives.
  - Application logs: Shorter retention (e.g., 90 days).

- **Access Control:**
  - Role-based access to log data
  - Privileged access for security logs
  - Audit trail of log access

## 6. Mobile App Monitoring (Ethiopian Context)

### Crash Reporting

- **Tools:** Firebase Crashlytics, Sentry Mobile
- **Key Metrics:**
  - Crash-free users percentage
  - Crashes by app version
  - Crashes by device/OS (focus on models prevalent in Ethiopia).
  - Impact on business-critical flows

### Performance Monitoring (Ethiopian Networks)

- **App Startup Time:**
  - Cold start vs warm start
  - Time to interactive

- **Network Performance:**
  - API call latency (measured/simulated for Ethiopian networks).
  - Request success rate (consider higher tolerance for network drops).

- **UI Performance:**
  - Screen rendering time (including Amharic text).
  - Frame rate during animations
  - Response to user interactions

### Mobile Release Monitoring

- **Phased Rollout Monitoring:**
  - Crash rates compared to previous version
  - User engagement metrics
  - Critical business flow completion rates

- **App Store Metrics:**
  - Download/update rates
  - Review sentiment analysis
  - Uninstall tracking

## 7. Transaction Monitoring (ETB & Local Providers)

### Payment Processing

- **Success/Failure Rates:**
  - By Ethiopian payment method type (Telebirr, HelloCash, etc.).
  - By ETB transaction amount range.

- **Processing Time:**
  - Authorization time
  - End-to-end transaction time
  - Processing time outliers

- **Fraud Indicators:**
  - Suspicious transaction patterns
  - Multiple failed attempts
  - Velocity checks (transactions per time period)

### Financial Reconciliation (ETB)

- **Balance Verification:**
  - Daily reconciliation of ETB transactions.
  - Detection of discrepancies with Telebirr/HelloCash reports.

- **Settlement Monitoring:**
  - ETB settlement success rate.
  - Settlement timing
  - Failed settlement resolution

## 8. Security Monitoring (NBE Compliance & Local Threats)

### Access Monitoring

- **Authentication Activity:**
  - Failed login attempts (consider patterns targeting Ethiopian accounts).
  - Password reset requests
  - New device logins
  - Session activity

- **Authorization Checks:**
  - Privilege escalation attempts.
  - Unauthorized access attempts (monitor access to NBE-sensitive data/configs).

### Threat Detection (Ethiopian Context)

- **Common Attack Patterns:**
  - Monitor for attacks targeting Ethiopian financial systems or specific provider integrations.
  - Unusual access patterns from unexpected regions or IP ranges.

- **Data Exfiltration:**
  - Monitor unusual access volumes for Ethiopian user data (PII, financial).

### Compliance Monitoring (NBE & Local Laws)

- **NBE Requirements:**
  - Monitor configurations for compliance with NBE security directives.
  - Track access to sensitive data stores.
  - Validate system uptime against NBE requirements for critical services.

- **Regulatory Compliance (Ethiopian):**
  - Ethiopian data protection law compliance (log access, consent checks).
  - Audit-ready logging for NBE reviews.
  - Data retention compliance validation.

## 9. Incident Management Process

### Incident Detection

- **Automated Detection:**
  - Alert triggering
  - Anomaly detection
  - Pattern recognition

- **Manual Reporting:**
  - Customer support issues
  - Internal user reports
  - Third-party notifications

### Incident Response Workflow

1.  **Alert/Detection:** Issue identified through monitoring or report
2.  **Triage:** Assess severity and initial impact
3.  **Notification:** Alert appropriate team members
4.  **Investigation:** Determine root cause
5.  **Mitigation:** Implement immediate fix or workaround
6.  **Resolution:** Apply permanent solution
7.  **Post-Mortem:** Analyze incident and identify improvements

### Incident Communication

- **Internal Communication:**
  - Slack channel for incident updates
  - Regular status updates
  - Handoff documentation between teams/shifts

- **External Communication:**
  - Customer notifications for major incidents (in Amharic/English).
  - Status page updates (consider accessibility for Ethiopian users).
  - Regulatory reporting to NBE if required by incident type/severity.

## 10. Monitoring Dashboard Examples

### Executive Dashboard

- **Business Metrics:**
  - Daily/weekly transaction volume
  - Revenue metrics
  - User growth
  - Key performance indicators

- **Operational Health:**
  - System uptime
  - Success rates for critical flows
  - Incident summary

### Technical Operations Dashboard

- **System Health:**
  - Infrastructure utilization
  - Service health status
  - Error rates
  - Performance metrics

- **Alerting Overview:**
  - Active alerts
  - Recently resolved issues
  - Alert frequency trends

### Financial Dashboard (ETB Focus)

- **Transaction Metrics:**
  - ETB transaction volume by type.
  - Approval/decline rates (overall and per provider).
  - Payment method distribution (Telebirr vs. HelloCash vs. ...).
  - Revenue metrics (ETB).

- **Credit Risk Metrics (Ethiopian Portfolio):**
  - Delinquency rates (ETB).
  - Default rates (ETB).
  - Average credit utilization (ETB).
  - Risk score distribution (alternative data model).

## 11. Continuous Improvement

### Monitoring Evaluation

- **Alert Effectiveness:**
  - False positive rate
  - Missed incidents
  - Alert response time

- **Coverage Assessment:**
  - Gap analysis
  - New feature monitoring
  - Emerging risk coverage

### Feedback Loops

- **Post-Incident Reviews:**
  - Monitoring improvements identified
  - Alert tuning recommendations
  - Missing observability data

- **Regular Reviews:**
  - Quarterly monitoring strategy reviews
  - Alignment with business objectives
  - Regulatory requirement changes (NBE, Ethiopian laws).

## 12. Implementation Examples (Ethiopian Context)

### Kubernetes Monitoring Setup

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: meqenet-api
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: meqenet-api
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

### Custom Business Metrics Implementation (ETB Transactions)

```javascript
// Node.js Express middleware for transaction metrics (ETB)
const promClient = require('prom-client');

// Create a counter for transactions
const transactionCounter = new promClient.Counter({
  name: 'meqenet_et_payment_transactions_total', // Specific name
  help: 'Total number of payment transactions in Ethiopia',
  labelNames: ['status', 'payment_provider', 'merchant_id', 'currency'],
});

// Create a gauge for transaction value
const transactionValue = new promClient.Gauge({
  name: 'meqenet_et_payment_transaction_value_etb',
  help: 'Value of payment transactions in ETB',
  labelNames: ['status', 'payment_provider', 'merchant_id'],
});

// Middleware to track transaction metrics
app.use('/api/transactions', (req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    // Track transaction after completion
    if (req.method === 'POST' && res.statusCode < 400) {
      // Assuming successful transaction
      try {
        const data = JSON.parse(body);
        const paymentProvider = req.body.payment_method_type || 'unknown'; // Get provider info

        transactionCounter.inc({
          status: data.status,
          payment_provider: paymentProvider,
          merchant_id: data.merchant_id,
          currency: data.currency, // Should be ETB
        });

        if (data.currency === 'ETB') {
          transactionValue.set(
            {
              status: data.status,
              payment_provider: paymentProvider,
              merchant_id: data.merchant_id,
            },
            parseFloat(data.amount)
          );
        }
      } catch (e) {
        logger.error('Failed to parse response or record metrics', { error: e });
      }
    }

    return originalSend.apply(this, arguments);
  };

  next();
});
```

### Mobile App Crash Reporting Setup

```kotlin
// Android Crashlytics setup
class MeqenetApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Crashlytics
        FirebaseApp.initializeApp(this)
        FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(true)

        // Set user identifier (sanitized)
        val userId = UserManager.getUserIdHash() // hashed user ID
        if (userId != null) {
            FirebaseCrashlytics.getInstance().setUserId(userId)
        }

        // Log app startup
        FirebaseCrashlytics.getInstance().log("Application started")
    }
}
```

### Log Sanitization Example (Fayda ID)

```javascript
function sanitizeLogData(data) {
  const sanitized = { ...data };
  // Mask PII according to Ethiopian data protection rules
  if (sanitized.faydaId) {
    // Example: Show only last 4 digits - adjust based on actual format/rules
    sanitized.faydaId = `********${sanitized.faydaId.slice(-4)}`;
  }
  if (sanitized.phoneNumber) {
    // Example: Mask middle digits
    sanitized.phoneNumber = `${sanitized.phoneNumber.slice(0, 4)}****${sanitized.phoneNumber.slice(-3)}`;
  }
  // Add other fields like email, name etc.
  return sanitized;
}

logger.info('User KYC submitted', sanitizeLogData(kycData));
```
