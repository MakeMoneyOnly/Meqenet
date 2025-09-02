./# 📊 Dashboard Operations Guide

## Executive Dashboard Technical Documentation

This guide provides detailed technical documentation for operating and extending the individual
C-suite governance dashboards. All dashboard scripts are located in `governance/dashboards/`.

---

## 🏢 CCO Dashboard - Compliance & Risk Monitoring

### Script: `dashboards/cco.py` ✅ **FIXED & WORKING**

**Purpose**: Generates daily "Compliance & Risk Dashboard" providing centralized view of platform's
adherence to regulatory and internal governance standards, tailored for Ethiopian financial context.

**Focus Areas**:

1. **NBE & Regulatory Compliance**: Verifies existence and status of critical compliance documents
2. **Data Privacy & Governance**: Audits codebase and logs for PII leaks and Ethiopian data
   protection compliance
3. **Anti-Money Laundering (AML)**: Analyzes transaction patterns to detect suspicious activities

**How to Run** (New Unified Commands):

```bash
# 🎯 Via Orchestrator (Recommended)
python orchestrator.py --run-dashboard cco
python orchestrator.py --run-dashboard cco --force  # Force execution

# 🌐 Via Dashboard Interface
python dashboard.py --cco
python dashboard.py --web  # Then navigate to CCO dashboard

# 💻 Via Terminal Interface
python dashboard.py --terminal  # Then select CCO from menu
```

**Output**:

- File: `reports/dashboards/cco/enhanced_cco_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Critical tool for internal audits, regulatory reporting, and remediation efforts

**Database**: `data/compliance.db` - Stores compliance tracking data

**✅ Fixed Issues**:

- Added missing `get_dashboard_data()` method
- Implemented proper data fetching with fallbacks
- Fixed console input handling for Windows
- Applied fintech naming conventions

**Extensibility**:

- Add new compliance checks by creating functions that return structured data
- Update `generate_cco_dashboard` function to include new sections
- Future enhancements: fair lending practices, access control audits, consumer protection validation

---

## 💰 CFO Dashboard - Financial Operations & FinOps

### Script: `dashboards/cfo.py` ✅ **FIXED & WORKING**

**Purpose**: Generates monthly "Cloud Cost & FinOps Dashboard" providing service-oriented breakdown
of cloud spending with actionable optimization insights.

**Focus Areas**:

1. **Cost Attribution**: Simulates cloud billing data attribution to specific microservices
2. **FinOps Insights**: Analyzes cost data to detect inefficiencies and provide recommendations

**How to Run** (New Unified Commands):

```bash
# 🎯 Via Orchestrator (Recommended)
python orchestrator.py --run-dashboard cfo
python orchestrator.py --run-dashboard cfo --force  # Force execution

# 🌐 Via Dashboard Interface
python dashboard.py --cfo
python dashboard.py --web  # Then navigate to CFO dashboard

# 💻 Via Terminal Interface
python dashboard.py --terminal  # Then select CFO from menu
```

**Output**:

- File: `reports/dashboards/cfo/enhanced_cfo_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Provides CFO and engineering leads clear view of spending and optimization opportunities

**Database**: `data/finops.db` - Stores financial and cost optimization data

**✅ Fixed Issues**:

- Added missing `get_dashboard_data()` method
- Implemented proper financial data aggregation
- Fixed console input handling for Windows
- Applied fintech naming conventions

**Extensibility**:

- Integrate with cloud provider APIs (AWS Cost Explorer) for real-time data
- Add sophisticated analysis modules for unattached volumes, snapshots, anomaly detection
- Integrate with budgeting systems for spend vs. forecast comparison
- Calculate unit economics (cost per user, per transaction)

---

## 🏢 CEO Dashboard - Strategic Business Intelligence

### Script: `dashboards/ceo.py` ✅ **FIXED & WORKING**

**Purpose**: Generates comprehensive strategic business dashboard with KPI tracking, market
intelligence, and executive decision support.

**Focus Areas**:

1. **Strategic KPI Tracking**: Revenue, growth, market share, customer metrics
2. **Board-level Reporting**: Executive summaries and investor communications
3. **Strategic Initiative Monitoring**: Progress tracking and ROI analysis
4. **Market Intelligence**: Competitive analysis and opportunity identification
5. **Risk Management**: Enterprise-wide risk assessment and mitigation

**How to Run** (New Unified Commands):

```bash
# 🎯 Via Orchestrator (Recommended)
python orchestrator.py --run-dashboard ceo
python orchestrator.py --run-dashboard ceo --force  # Force execution

# 🌐 Via Dashboard Interface
python dashboard.py --ceo
python dashboard.py --web  # Then navigate to CEO dashboard

# 💻 Via Terminal Interface
python dashboard.py --terminal  # Then select CEO from menu
```

**Output**:

- File: `reports/dashboards/ceo/ceo_strategic_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Board-ready executive summaries and strategic recommendations

**Database**: `data/executive_metrics.db` - Stores strategic KPIs and business metrics

**✅ Fixed Issues**:

- Added missing `get_dashboard_data()` method
- Implemented comprehensive strategic KPI tracking
- Fixed console input handling for Windows
- Applied fintech naming conventions
- Integrated with unified orchestrator architecture

---

## 🔧 CTO Dashboard - Enterprise Technology Intelligence

### Script: `dashboards/cto.py` ✅ **FIXED & WORKING**

**Purpose**: Advanced AI-powered technology governance system providing comprehensive technology
risk assessment, predictive analytics, and strategic insights.

**Focus Areas**:

1. **System Health Monitoring**: Real-time infrastructure and application metrics
2. **Security Integration**: Vulnerability scanning and technical security oversight
3. **Architecture Compliance**: Feature-Sliced Architecture (FSA) validation
4. **DevOps Metrics**: DORA metrics and deployment pipeline health
5. **Ethiopian FinTech Specialization**: NBE API, Fayda ID, EthSwitch monitoring

**How to Run** (New Unified Commands):

```bash
# 🎯 Via Orchestrator (Recommended)
python orchestrator.py --run-dashboard cto
python orchestrator.py --run-dashboard cto --force  # Force execution

# 🌐 Via Dashboard Interface
python dashboard.py --cto
python dashboard.py --web  # Then navigate to CTO dashboard

# 💻 Via Terminal Interface
python dashboard.py --terminal  # Then select CTO from menu
```

**Advanced Setup** (Continuous Monitoring):

```bash
# Start automated monitoring via orchestrator
python orchestrator.py --scheduler

# Access real-time metrics through orchestrator
python orchestrator.py --status
```

**Output**:

- File: `reports/dashboards/cto/enhanced_cto_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Real-time metrics available through unified orchestrator

**Database**: `data/technical_health.db` - Stores technical metrics and analysis data

**✅ Fixed Issues**:

- Added missing `get_dashboard_data()` method
- Implemented comprehensive system health monitoring
- Fixed console input handling for Windows
- Applied fintech naming conventions
- Integrated with unified orchestrator architecture

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

### Script: `dashboards/ciso.py` ✅ **FIXED & WORKING**

**Purpose**: Comprehensive security intelligence platform providing real-time threat monitoring,
vulnerability assessment, and compliance tracking.

**Focus Areas**:

1. **Threat Intelligence**: Real-time threat monitoring and analysis
2. **Incident Management**: Security incident tracking and response
3. **Vulnerability Assessment**: Comprehensive security posture analysis
4. **Compliance Frameworks**: NIST, ISO27001, SOC2, PCI-DSS tracking
5. **Security Metrics**: Performance tracking across preventive, detective, and responsive controls

**How to Run** (New Unified Commands):

```bash
# 🎯 Via Orchestrator (Recommended)
python orchestrator.py --run-dashboard ciso
python orchestrator.py --run-dashboard ciso --force  # Force execution

# 🌐 Via Dashboard Interface
python dashboard.py --ciso
python dashboard.py --web  # Then navigate to CISO dashboard

# 💻 Via Terminal Interface
python dashboard.py --terminal  # Then select CISO from menu
```

**Output**:

- File: `reports/dashboards/ciso/ciso_security_dashboard_YYYY-MM-DD_HH-MM-SS.md`
- Comprehensive security posture and threat intelligence reports

**Database**: `data/security_metrics.db` - Stores security metrics and threat intelligence

**✅ Fixed Issues**:

- Added missing `get_dashboard_data()` method
- Implemented comprehensive security monitoring
- Fixed console input handling for Windows
- Applied fintech naming conventions
- Integrated with unified orchestrator architecture

---

## 🚀 Deployment & Management

### 🎯 Unified Orchestrator (Main Entry Point)

**Run All Dashboards**:

```bash
# From governance directory - NEW UNIFIED COMMAND
python orchestrator.py --run-all
python orchestrator.py --run-all --force  # Force disabled dashboards
```

**Run Specific Dashboard**:

```bash
# Individual dashboards - NEW UNIFIED COMMANDS
python orchestrator.py --run-dashboard ceo
python orchestrator.py --run-dashboard cfo
python orchestrator.py --run-dashboard cto
python orchestrator.py --run-dashboard cco
python orchestrator.py --run-dashboard ciso
python orchestrator.py --run-dashboard unified
```

**Interactive Menu**:

```bash
# Launch interactive governance menu - NEW FEATURE
python orchestrator.py --menu
```

**Scheduled Execution**:

```bash
# Start automated monitoring - NEW UNIFIED COMMAND
python orchestrator.py --scheduler

# Set up cron job (Linux/macOS)
0 8 * * * cd /path/to/Meqenet/governance && python orchestrator.py --run-all

# Windows Task Scheduler
# Action: python.exe
# Arguments: orchestrator.py --run-all
# Start in: C:\path\to\Meqenet\governance
```

### 🌐 Dashboard Interface

**Web Dashboards** (Recommended):

```bash
# Launch web-based dashboard suite
python dashboard.py --web
# Access at http://localhost:8080
```

**Terminal Dashboards**:

```bash
# Launch terminal-based dashboard suite
python dashboard.py --terminal
```

**Direct Dashboard Launch**:

```bash
# Direct access to specific dashboards
python dashboard.py --ceo
python dashboard.py --cfo
# ... etc for all dashboards
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

- **✅ FIXED - Dashboard Errors**: All `get_dashboard_data` method errors resolved
- **✅ FIXED - Console Input**: Windows console input handling errors fixed
- **✅ FIXED - Import Errors**: Dependencies properly managed via `setup.py`
- **Database Locked**: Close any database connections before running scripts
- **Permission Errors**: Ensure write access to `reports/` and `data/` directories
- **Unicode Errors**: Scripts include safe_print() functions for Windows console compatibility

**Debug Mode**:

```bash
# Run with detailed logging - NEW UNIFIED COMMANDS
python orchestrator.py --run-all --force  # Force execution with logging
python orchestrator.py --run-dashboard ceo --force  # Force specific dashboard
```

**Individual Dashboard Testing**:

```bash
# Test specific dashboard via orchestrator
python orchestrator.py --run-dashboard cco --force

# Test dashboard via interface
python dashboard.py --cco

# Check system status
python orchestrator.py --status
```

**New Troubleshooting Features**:

```bash
# ✅ VALIDATE installation
python setup.py --validate

# ✅ CHECK system status
python orchestrator.py --status

# ✅ FORCE execution (bypasses disabled status)
python orchestrator.py --run-dashboard ceo --force

# ✅ INTERACTIVE menu for troubleshooting
python orchestrator.py --menu
```

---

## 🔧 Development & Extension

### ✅ **New Unified Architecture**

The governance framework has been completely refactored into a **3-script architecture**:

1. **`orchestrator.py`** - Main orchestrator combining deployment, scheduling, and execution
2. **`dashboard.py`** - Unified interface for both web and terminal dashboards
3. **`setup.py`** - Installation and configuration (all linter errors fixed)

### Adding New Dashboards

1. **Create Script**: Add new dashboard module to `governance/dashboards/`
2. **Implement Interface**: Add `get_dashboard_data()` method following existing patterns
3. **Update Config**: Add dashboard config to `config/governance_config.yaml`
4. **Database Schema**: Create new database in `governance/data/`
5. **Auto-Integration**: New dashboards are automatically discovered by the unified orchestrator

### Code Standards (✅ All Applied)

- **✅ Error Handling**: Comprehensive try-catch blocks with detailed logging
- **✅ Unicode Safety**: Cross-platform compatibility with Windows support
- **✅ Database Management**: Context managers and proper connection handling
- **✅ Configuration**: Centralized config management with multiple formats
- **✅ Logging**: Structured logging with appropriate levels and file output
- **✅ Naming Conventions**: PascalCase classes, camelCase functions, UPPER_CASE constants

### Testing (✅ Enhanced)

```bash
# 🎯 NEW UNIFIED TESTING COMMANDS
python orchestrator.py --run-dashboard new_dashboard --force  # Test new dashboard
python orchestrator.py --status                               # Check all dashboards
python setup.py --validate                                   # Validate installation
python orchestrator.py --menu                                 # Interactive testing

# 🌐 WEB INTERFACE TESTING
python dashboard.py --web                                     # Test web interface
python dashboard.py --terminal                               # Test terminal interface

# 📊 SYSTEM VALIDATION
python setup.py --validate                                   # Full system validation
python orchestrator.py --status                              # Real-time status check
```

This technical guide should be used alongside the main `README.md` for complete governance framework
documentation.
