# Meqenet.et Governance Framework Installation Guide

## 🚀 Quick Installation

The fastest way to get started is using our unified setup script with built-in fallback support:

```bash
# Clone or navigate to your Meqenet project
cd /path/to/Meqenet

# Run the automated setup from governance directory
cd governance

# Full installation (recommended)
python setup.py

# Quick setup with defaults (no prompts)
python setup.py --quick

# Simple installation (if you have dependency issues)
python setup.py --simple
```

The setup script automatically handles dependency issues and provides multiple installation modes
with graceful fallback.

### 🔧 Additional Setup Options

```bash
# Install with optional ML/AI packages
python setup.py --include-optional

# Validate existing installation
python setup.py --validate

# Force reinstallation over existing setup
python setup.py --force

# Uninstall framework (creates backup first)
python setup.py --uninstall
```

## 📋 Prerequisites

### System Requirements

- **Python 3.9+** (Required)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux Ubuntu 18.04+
- **Memory**: Minimum 4GB RAM (8GB recommended for ML features)
- **Storage**: 2GB free space (5GB for optional ML packages)
- **Network**: Internet connection for package downloads

### Pre-Installation Checks

1. **Verify Python Version**:

   ```bash
   python --version
   # Should show Python 3.9.0 or higher
   ```

2. **Verify pip is working**:

   ```bash
   pip --version
   ```

3. **Ensure you're in the Meqenet project directory**:
   ```bash
   ls -la
   # Should see: governance/, backend/, docs/, etc.
   ```

## 🔧 Manual Installation (Advanced Users)

If you prefer manual installation or need custom configuration:

### Step 1: Install Core Dependencies

```bash
pip install --upgrade pip

# Minimal core packages (for simple mode)
pip install pyyaml>=6.0 requests>=2.28.0 packaging>=21.0

# Full dependencies (for complete features)
pip install schedule>=1.2.0 aiohttp>=3.8.0 pandas>=1.5.0
pip install numpy>=1.21.0 matplotlib>=3.5.0 seaborn>=0.11.0
pip install plotly>=5.0.0
```

### Step 2: Install Optional Packages (Enhanced Features)

```bash
# Machine Learning & AI
pip install scikit-learn>=1.1.0 tensorflow>=2.10.0

# Cloud & Infrastructure
pip install boto3>=1.26.0 psutil>=5.9.0

# Database Connectors
pip install psycopg2-binary>=2.9.0 redis>=4.3.0

# Web & Visualization
pip install flask>=2.2.0 dash>=2.7.0 streamlit>=1.15.0

# Background Processing
pip install celery>=5.2.0
```

### Step 3: Create Directory Structure

```bash
mkdir -p governance/{CEO,CFO,CTO,CCO,CISO}/reports
mkdir -p governance/{config,logs,reports,unified_reports,backups}
```

### Step 4: Generate Configuration

```bash
# Use setup script just for configuration generation
python setup.py --validate  # This creates missing configs
```

Or create manually:

- `governance/config/governance_config.yaml` (or .json)
- `governance/.env.template`

## 🛠️ Troubleshooting

### Common Installation Issues

1. **ModuleNotFoundError**:

   ```bash
   python setup.py --simple  # Use minimal installation mode
   ```

2. **pkg_resources deprecated warning**:
   - This is normal - setup.py uses modern APIs with fallbacks
   - Can be safely ignored

3. **"Can't install --user in virtualenv"**:
   - Setup script automatically detects and handles this
   - No action needed

4. **Permission errors**:

   ```bash
   # Use virtual environment (recommended)
   python -m venv governance_env
   source governance_env/bin/activate  # Linux/macOS
   governance_env\Scripts\activate     # Windows
   python setup.py
   ```

5. **Network timeouts**:
   - Setup includes automatic retries
   - For persistent issues, try manual installation

### Platform-Specific Notes

- **Windows**: Automatically detects Windows Terminal for color support
- **macOS**: Full compatibility with Homebrew Python installations
- **Linux**: Works with system Python, pyenv, and conda environments
- **Virtual Environments**: Automatically detected and handled appropriately

## 🎯 Quick Start Options

After installation, choose your preferred method:

### Option 1: Interactive Quick Start (Recommended)

```bash
python quick_start.py
```

### Option 2: Run All Dashboards

```bash
python governance/deploy_governance_suite.py --mode run
```

### Option 3: Run Specific Dashboard

```bash
# CEO Dashboard
python governance/deploy_governance_suite.py --dashboard ceo

# CFO Dashboard
python governance/deploy_governance_suite.py --dashboard cfo

# CTO Dashboard
python governance/deploy_governance_suite.py --dashboard cto

# CCO Dashboard
python governance/deploy_governance_suite.py --dashboard cco

# CISO Dashboard
python governance/deploy_governance_suite.py --dashboard ciso

# Unified Dashboard
python governance/deploy_governance_suite.py --dashboard unified
```

### Option 4: Scheduled Execution

```bash
python governance/deploy_governance_suite.py --mode schedule
```

## ⚙️ Configuration

### 1. Environment Variables

Copy the template and customize:

```bash
cp governance/.env.template governance/.env
nano governance/.env  # Edit with your settings
```

Key variables to configure:

- **Email Settings**: SMTP server details for notifications
- **Slack/Teams**: Webhook URLs for chat notifications
- **Database**: Connection strings for advanced features
- **NBE API**: Ethiopian National Bank API credentials (if available)
- **AWS**: Cloud integration settings

### 2. Dashboard Configuration

Edit `governance/config/governance_config.yaml`:

```yaml
dashboards:
  ceo:
    enabled: true
    schedule_cron: '0 8 * * *' # Daily at 8 AM
  cfo:
    enabled: true
    schedule_cron: '0 9 * * *' # Daily at 9 AM
  # ... customize other dashboards
```

### 3. Notification Settings

Configure alerts and reporting:

```yaml
notifications:
  email:
    enabled: true
    recipients:
      - 'ceo@meqenet.et'
      - 'cfo@meqenet.et'
  slack:
    enabled: true
    webhook_url: 'YOUR_SLACK_WEBHOOK'
```

## 🔍 Verification & Testing

### 1. Test Installation

```bash
python -c "
import yaml, pandas, numpy, matplotlib, seaborn, plotly
print('✅ All core packages installed successfully!')
"
```

### 2. Test Dashboard Execution

```bash
# Quick test of CEO dashboard
python governance/CEO/ceo_dashboard.py

# Check if reports are generated
ls -la governance/CEO/reports/
```

### 3. Verify Configuration

```bash
# Check configuration syntax
python -c "
import yaml
with open('governance/config/governance_config.yaml') as f:
    config = yaml.safe_load(f)
    print('✅ Configuration file is valid')
"
```

## 🐛 Troubleshooting

### Common Issues

#### "ModuleNotFoundError: No module named 'pkg_resources'" or "ModuleNotFoundError: No module named 'yaml'"

**Solution 1 - Use Simple Installer:**

```bash
cd governance
python simple_install.py  # This will bootstrap the essentials
python setup.py           # Then run the full setup
```

**Solution 2 - Manual Installation:**

```bash
pip install setuptools packaging pyyaml
python setup.py
```

#### "Permission denied" errors on Unix/macOS

```bash
chmod +x setup.py
sudo python setup.py  # If needed
```

#### "Microsoft Visual C++ 14.0 is required" (Windows)

Install Microsoft C++ Build Tools:

1. Download from [Microsoft](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Install "C++ build tools" workload
3. Retry installation

#### Memory errors with TensorFlow/ML packages

```bash
# Install without ML packages first
pip install tensorflow --no-cache-dir
```

#### Slow package installation

```bash
# Use different package index
pip install -i https://pypi.doubanio.com/simple/ package_name
```

### Getting Help

1. **Check Logs**:

   ```bash
   tail -f governance/logs/governance.log
   ```

2. **Validate Environment**:

   ```bash
   python governance/deploy_governance_suite.py --validate
   ```

3. **System Information**:
   ```bash
   python -c "
   import sys, platform
   print(f'Python: {sys.version}')
   print(f'Platform: {platform.platform()}')
   print(f'Architecture: {platform.architecture()}')
   "
   ```

## 🚀 Next Steps

After successful installation:

1. **📖 Read Documentation**: `governance/README.md`
2. **🔧 Configure Settings**: Edit configuration files
3. **🎯 Run Dashboards**: Start with CEO dashboard
4. **📊 View Reports**: Check `governance/reports/`
5. **🔄 Setup Automation**: Configure scheduled execution
6. **📱 Enable Notifications**: Set up email/Slack alerts

## 🏢 Ethiopian Fintech Compliance

The governance framework includes specific features for Ethiopian financial regulations:

- **NBE Compliance Monitoring**: Automated NBE regulatory compliance tracking
- **Fayda ID Integration**: Secure handling of Ethiopian national ID data
- **ETB Currency Support**: Ethiopian Birr transaction monitoring
- **Local Banking Integration**: Support for Ethiopian banking requirements
- **AML/KYC Compliance**: Anti-money laundering and know-your-customer tracking

Configure these features in the main configuration file and environment variables.

## 📞 Support

For installation issues or questions:

- **Email**: governance@meqenet.et
- **Documentation**: Check `governance/README.md`
- **Logs**: Review `governance/logs/` for detailed error information

---

**🏛️ Meqenet.et Governance Framework**  
_Enterprise-Grade C-Suite Dashboard Suite_  
_Version 2.0 - Ethiopian FinTech Edition_
