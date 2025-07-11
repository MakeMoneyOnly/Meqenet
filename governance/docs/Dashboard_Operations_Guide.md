# 📊 Dashboard Operations Guide

## Executive Dashboard Technical Documentation

This guide provides detailed technical documentation for operating and extending the individual
C-suite governance dashboards. All dashboard scripts are located in `governance/dashboards/`.

---

## 🏢 CCO Dashboard - Compliance & Risk Monitoring

### Script: `cco_dashboard.py`

**Purpose**: Generates daily "Compliance & Risk Dashboard" providing centralized view of platform's
adherence to regulatory and internal governance standards, tailored for Ethiopian financial context.

**Focus Areas**:

1. **NBE & Regulatory Compliance**: Verifies existence and status of critical compliance documents
2. **Data Privacy & Governance**: Audits codebase and logs for PII leaks and Ethiopian data
   protection compliance
3. **Anti-Money Laundering (AML)**: Analyzes transaction patterns to detect suspicious activities

**How to Run**:

```bash
# From governance directory
python dashboards/cco_dashboard.py
```

**Output**:

- File: `reports/dashboards/cco/enhanced_cco_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Critical tool for internal audits, regulatory reporting, and remediation efforts

**Database**: `data/compliance.db` - Stores compliance tracking data

**Extensibility**:

- Add new compliance checks by creating functions that return structured data
- Update `generate_cco_dashboard` function to include new sections
- Future enhancements: fair lending practices, access control audits, consumer protection validation

---

## 💰 CFO Dashboard - Financial Operations & FinOps

### Script: `cfo_dashboard.py`

**Purpose**: Generates monthly "Cloud Cost & FinOps Dashboard" providing service-oriented breakdown
of cloud spending with actionable optimization insights.

**Focus Areas**:

1. **Cost Attribution**: Simulates cloud billing data attribution to specific microservices
2. **FinOps Insights**: Analyzes cost data to detect inefficiencies and provide recommendations

**How to Run**:

```bash
# From governance directory
python dashboards/cfo_dashboard.py
```

**Output**:

- File: `reports/dashboards/cfo/enhanced_cfo_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Provides CFO and engineering leads clear view of spending and optimization opportunities

**Database**: `data/finops.db` - Stores financial and cost optimization data

**Extensibility**:

- Integrate with cloud provider APIs (AWS Cost Explorer) for real-time data
- Add sophisticated analysis modules for unattached volumes, snapshots, anomaly detection
- Integrate with budgeting systems for spend vs. forecast comparison
- Calculate unit economics (cost per user, per transaction)

---

## 🏢 CEO Dashboard - Strategic Business Intelligence

### Script: `ceo_dashboard.py`

**Purpose**: Generates comprehensive strategic business dashboard with KPI tracking, market
intelligence, and executive decision support.

**Focus Areas**:

1. **Strategic KPI Tracking**: Revenue, growth, market share, customer metrics
2. **Board-level Reporting**: Executive summaries and investor communications
3. **Strategic Initiative Monitoring**: Progress tracking and ROI analysis
4. **Market Intelligence**: Competitive analysis and opportunity identification
5. **Risk Management**: Enterprise-wide risk assessment and mitigation

**How to Run**:

```bash
# From governance directory
python dashboards/ceo_dashboard.py
```

**Output**:

- File: `reports/dashboards/ceo/ceo_strategic_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Board-ready executive summaries and strategic recommendations

**Database**: `data/executive_metrics.db` - Stores strategic KPIs and business metrics

---

## 🔧 CTO Dashboard - Enterprise Technology Intelligence

### Script: `cto_dashboard.py`

**Purpose**: Advanced AI-powered technology governance system providing comprehensive technology
risk assessment, predictive analytics, and strategic insights.

**Focus Areas**:

1. **System Health Monitoring**: Real-time infrastructure and application metrics
2. **Security Integration**: Vulnerability scanning and technical security oversight
3. **Architecture Compliance**: Feature-Sliced Architecture (FSA) validation
4. **DevOps Metrics**: DORA metrics and deployment pipeline health
5. **Ethiopian FinTech Specialization**: NBE API, Fayda ID, EthSwitch monitoring

**How to Run**:

```bash
# From governance directory
python dashboards/cto_dashboard.py
```

**Advanced Setup** (Continuous Monitoring):

```bash
# Launch full monitoring stack with Prometheus & Grafana
docker-compose -f monitoring/docker-compose.yml up --build

# Access Grafana Dashboard: http://localhost:3000 (admin/admin)
# Access Prometheus: http://localhost:9090
```

**Output**:

- File: `reports/dashboards/cto/enhanced_cto_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Metrics endpoint: `http://localhost:8008/metrics` (when running as service)

**Database**: `data/technical_health.db` - Stores technical metrics and analysis data

**Key Features**:

- **Technology Risk Assessment**: 5-dimensional risk scoring (Security, Performance,
  Maintainability, Compliance, Innovation)
- **AI-Powered Analytics**: Incident prediction using Isolation Forest ML models
- **Ethiopian FinTech Compliance**: NBE regulations, Fayda ID integration monitoring
- **Real-time Monitoring**: Prometheus/Grafana stack integration

**Architecture**:

```
governance/dashboards/cto_dashboard.py  # Main service
monitoring/docker-compose.yml          # Full monitoring stack
monitoring/prometheus/prometheus.yml   # Prometheus config
monitoring/grafana/provisioning/       # Grafana auto-setup
```

---

## 🔒 CISO Dashboard - Security Intelligence & Compliance

### Script: `ciso_dashboard.py`

**Purpose**: Comprehensive security intelligence platform providing real-time threat monitoring,
vulnerability assessment, and compliance tracking.

**Focus Areas**:

1. **Threat Intelligence**: Real-time threat monitoring and analysis
2. **Incident Management**: Security incident tracking and response
3. **Vulnerability Assessment**: Comprehensive security posture analysis
4. **Compliance Frameworks**: NIST, ISO27001, SOC2, PCI-DSS tracking
5. **Security Metrics**: Performance tracking across preventive, detective, and responsive controls

**How to Run**:

```bash
# From governance directory
python dashboards/ciso_dashboard.py
```

**Output**:

- File: `reports/dashboards/ciso/ciso_security_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Comprehensive security posture and threat intelligence reports

**Database**: `data/security_metrics.db` - Stores security metrics and threat intelligence

---

## 🚀 Deployment & Management

### Unified Deployment

**Run All Dashboards**:

```bash
# From governance directory
python deploy_governance_suite.py --mode run
```

**Scheduled Execution**:

```bash
# Set up cron job (Linux/macOS)
0 8 * * * cd /path/to/Meqenet/governance && python deploy_governance_suite.py --mode run

# Windows Task Scheduler
# Action: python.exe
# Arguments: deploy_governance_suite.py --mode run
# Start in: C:\path\to\Meqenet\governance
```

### Configuration Management

**Main Config**: `config/governance_config.yaml`

```yaml
dashboards:
  cco:
    enabled: true
    schedule_cron: '0 8 * * *'
    timeout_minutes: 10
  cfo:
    enabled: true
    schedule_cron: '0 9 1 * *' # Monthly
    timeout_minutes: 15
  # ... other dashboards
```

### Database Management

All databases are SQLite files stored in `governance/data/`:

- `compliance.db` - CCO compliance tracking
- `finops.db` - CFO financial data
- `executive_metrics.db` - CEO strategic metrics
- `technical_health.db` - CTO technology metrics
- `security_metrics.db` - CISO security data

### Report Organization

Reports are organized in `governance/reports/dashboards/`:

```
reports/
├── dashboards/
│   ├── cco/          # CCO compliance reports
│   ├── ceo/          # CEO strategic reports
│   ├── cfo/          # CFO financial reports
│   ├── ciso/         # CISO security reports
│   └── cto/          # CTO technical reports
└── governance_execution_summary_*.md  # Overall execution summaries
```

### Troubleshooting

**Common Issues**:

- **Import Errors**: Ensure all dependencies installed via `pip install -r requirements.txt`
- **Database Locked**: Close any database connections before running scripts
- **Permission Errors**: Ensure write access to `reports/` and `data/` directories
- **Unicode Errors**: Scripts include safe_print() functions for Windows console compatibility

**Debug Mode**:

```bash
# Run with detailed logging
python deploy_governance_suite.py --mode run --debug
```

**Individual Script Testing**:

```bash
# Test specific dashboard
python dashboards/cco_dashboard.py --test
```

---

## 🔧 Development & Extension

### Adding New Dashboards

1. **Create Script**: Add new script to `governance/dashboards/`
2. **Update Config**: Add dashboard config to `governance_config.yaml`
3. **Database Schema**: Create new database in `governance/data/`
4. **Report Structure**: Create report directory in `reports/dashboards/`
5. **Integration**: Update `deploy_governance_suite.py` dashboard configs

### Code Standards

- **Error Handling**: Use try-catch blocks with detailed logging
- **Unicode Safety**: Include safe_print() for Windows compatibility
- **Database Management**: Use context managers for database connections
- **Configuration**: Load settings from config files, not hardcoded values
- **Logging**: Use structured logging with appropriate levels

### Testing

```bash
# Run test suite
python -m pytest governance/tests/

# Test individual dashboard
python governance/dashboards/cco_dashboard.py --validate
```

This technical guide should be used alongside the main `README.md` for complete governance framework
documentation.
