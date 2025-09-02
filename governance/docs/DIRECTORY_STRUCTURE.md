# 📁 Governance Directory Structure

## Streamlined & Enterprise-Grade Organization

```
governance/
├── config/                    # Configuration files
│   ├── config.yaml           # Main governance configuration
│   ├── config.json           # Alternative JSON config
│   └── config.fintech.yaml   # FinTech-specific settings
├── dashboards/               # Executive dashboard modules
│   ├── __init__.py          # Package initialization
│   ├── ceo.py               # CEO Strategic Dashboard ✅ FIXED
│   ├── cfo.py               # CFO Financial Dashboard ✅ FIXED
│   ├── cto.py               # CTO Technical Dashboard ✅ FIXED
│   ├── cco.py               # CCO Compliance Dashboard ✅ FIXED
│   ├── ciso.py              # CISO Security Dashboard ✅ FIXED
│   └── unified.py           # Unified Executive Dashboard ✅ FIXED
├── data/                    # Database files (gitignored)
│   ├── executive_metrics.db
│   ├── finops.db
│   ├── technical_health.db
│   ├── compliance.db
│   └── security_metrics.db
├── docs/                    # Documentation
│   ├── DIRECTORY_STRUCTURE.md
│   ├── INSTALLATION.md
│   └── Dashboard_Operations_Guide.md
├── logs/                    # Log files (gitignored)
├── reports/                 # Generated reports (gitignored)
├── tools/                   # Utility tools
│   ├── __init__.py
│   ├── check_env_access.py
│   ├── check_toolchain_parity.py
│   └── lint_docker_flags.py
├── .gitignore              # Keep folder clean
├── orchestrator.py         # 🎯 UNIFIED Orchestrator (Main Entry Point)
├── dashboard.py            # 🎯 UNIFIED Dashboard Interface (Web + Terminal)
├── local_ci_validator.py   # CI/CD validation
├── README.md               # Main documentation
├── requirements.txt        # Python dependencies
└── setup.py               # Installation script ✅ FIXED
```

## 🏗️ Architecture Principles

### **Streamlined Organization**

- **3 Core Scripts**: Reduced from 7+ scripts to maintainable 3-core architecture
- **Separation of Concerns**: Orchestrator, Interface, Setup properly separated
- **Conventional Naming**: Files follow Python naming conventions
- **Package Structure**: Proper Python packages with `__init__.py`
- **Git-friendly**: Generated files ignored, source files tracked

### **Maintainability**

- **Unified Orchestrator**: All deployment, scheduling, and execution in one place
- **Unified Interface**: Both web and terminal dashboards in single interface
- **Configuration Management**: Centralized config with multiple formats
- **Dependency Management**: Clear requirements and setup scripts
- **Documentation**: Comprehensive docs for all components

### **Enterprise Standards**

- **Security**: Sensitive files gitignored, secure configuration
- **Reliability**: Proper error handling and logging
- **Scalability**: Modular architecture supports future expansion
- **Compliance**: FinTech-specific compliance considerations
- **Quality**: All linter errors fixed, code standards applied

## ✅ Recent Improvements

### **Major Fixes Applied**

- **✅ Dashboard Scripts**: All 6 dashboard scripts fixed with missing methods
- **✅ Console Input**: Windows console input handling errors resolved
- **✅ Setup Script**: All linter errors fixed, proper indentation
- **✅ Configuration**: Updated config files with correct script paths
- **✅ Naming Standards**: PascalCase classes, camelCase functions applied
- **✅ File Cleanup**: Removed duplicate files, **pycache**, old reports

## 🎯 File Naming Conventions

### **Scripts**

- `snake_case.py` - Python scripts and modules
- `PascalCase.py` - Classes (when applicable)

### **Configuration**

- `config.yaml` - Primary configuration (YAML)
- `config.json` - Alternative configuration (JSON)
- `config.fintech.yaml` - Domain-specific configuration

### **Directories**

- `snake_case/` - Package directories
- `CamelCase/` - Reserved for future class-based modules

## 🚀 Quick Reference

```bash
# 🎯 UNIFIED WORKFLOW - Just 3 Commands!

# 1. Setup & Installation
python governance/setup.py                    # Install everything
python governance/setup.py --quick           # Quick setup
python governance/setup.py --validate        # Check installation

# 2. Launch Orchestrator (Main Interface)
python governance/orchestrator.py --menu     # Interactive menu
python governance/orchestrator.py --status   # System status
python governance/orchestrator.py --run-all  # Run all dashboards
python governance/orchestrator.py --scheduler # Start monitoring

# 3. Launch Dashboard Interface
python governance/dashboard.py --web         # Web dashboards
python governance/dashboard.py --terminal    # Terminal dashboards
python governance/dashboard.py --ceo         # Direct CEO dashboard

# LEGACY SCRIPTS REMOVED:
# - deploy_governance_suite.py ✅ Consolidated into orchestrator.py
# - quickstart.py ✅ Consolidated into orchestrator.py
# - run_terminal_dashboards.py ✅ Consolidated into dashboard.py
# - terminal_dashboards.py ✅ Consolidated into dashboard.py
# - dashboard_server.py ✅ Consolidated into dashboard.py
# - init_databases.py ✅ Integrated into orchestrator.py
```

---

**🏛️ Meqenet.et Governance Framework** | _Enterprise-Grade C-Suite Dashboard Suite_
