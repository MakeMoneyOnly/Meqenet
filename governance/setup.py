#!/usr/bin/env python3
"""
Meqenet.et Governance Framework Setup
Enterprise-Grade C-Suite Dashboard Installation & Configuration

This cross-platform setup script handles all prerequisites and initial configuration
for the Enhanced C-Suite Governance Framework on Windows, Linux, and macOS.

Features both full installation and simple fallback mode for dependency issues.

Usage:
    python setup.py                    # Full interactive setup
    python setup.py --quick           # Quick setup with defaults
    python setup.py --simple          # Simple installation (minimal dependencies)
    python setup.py --validate        # Validate existing installation
    python setup.py --uninstall       # Remove governance framework

Author: Meqenet.et Governance Team
"""

import os
import sys
import subprocess
import json
import shutil
import platform
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import datetime

# Global flags for available functionality
HAS_ADVANCED_FEATURES = True
FALLBACK_MODE = False

# Handle missing packages gracefully and avoid deprecated pkg_resources
try:
    # Use modern importlib.metadata instead of deprecated pkg_resources
    from importlib import metadata
    from packaging import version
    HAS_METADATA = True
    HAS_PACKAGING = True
except ImportError:
    try:
        # Fallback to importlib_metadata for older Python versions
        import importlib_metadata as metadata
        from packaging import version
        HAS_METADATA = True
        HAS_PACKAGING = True
    except ImportError:
        try:
            # Last resort: use deprecated pkg_resources with warning suppression
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", UserWarning)
                import pkg_resources
            from packaging import version
            HAS_METADATA = False
            HAS_PACKAGING = True
        except ImportError:
            HAS_METADATA = False
            HAS_PACKAGING = False
            HAS_ADVANCED_FEATURES = False
            
            # Define a simple version comparison function as fallback
            def simple_version_compare(v1: str, v2: str) -> bool:
                """Simple version comparison (major.minor.patch)"""
                try:
                    v1_parts = [int(x) for x in v1.split('.')]
                    v2_parts = [int(x) for x in v2.split('.')]
                    
                    # Pad shorter version with zeros
                    max_len = max(len(v1_parts), len(v2_parts))
                    v1_parts.extend([0] * (max_len - len(v1_parts)))
                    v2_parts.extend([0] * (max_len - len(v2_parts)))
                    
                    return v1_parts >= v2_parts
                except (ValueError, AttributeError):
                    return True  # If we can't parse, assume it's OK

# Configuration
REQUIRED_PYTHON_VERSION = "3.9.0"
GOVERNANCE_DIR = Path(__file__).parent
PROJECT_ROOT = GOVERNANCE_DIR.parent

# Core packages needed for basic functionality (simple mode)
CORE_PACKAGES = {
    "pyyaml": "6.0",
    "requests": "2.28.0",
    "packaging": "21.0"
}

# Required packages for full functionality
REQUIRED_PACKAGES = {
    "pyyaml": "6.0",
    "schedule": "1.2.0", 
    "aiohttp": "3.8.0",
    "pandas": "1.5.0",
    "numpy": "1.21.0",
    "matplotlib": "3.5.0",
    "seaborn": "0.11.0",
    "plotly": "5.0.0",
    "requests": "2.28.0",
    "packaging": "21.0"
}

# Optional packages for enhanced features
OPTIONAL_PACKAGES = {
    "scikit-learn": "1.1.0",
    "tensorflow": "2.10.0", 
    "boto3": "1.26.0",
    "psutil": "5.9.0",
    "psycopg2-binary": "2.9.0",
    "redis": "4.3.0",
    "celery": "5.2.0",
    "flask": "2.2.0",
    "dash": "2.7.0",
    "streamlit": "1.15.0"
}

# Platform-specific optional packages (problematic on some systems)
PLATFORM_SENSITIVE_PACKAGES = {
    "tensorflow": {
        "min_version": "2.10.0",
        "supported_python": [(3, 9), (3, 10), (3, 11)],  # TensorFlow supported Python versions
        "unsupported_platforms": ["darwin-arm64"],  # Apple Silicon has specific requirements
        "fallback_message": "TensorFlow requires specific Python versions (3.9-3.11) and platform support. For Apple Silicon, use 'pip install tensorflow-macos tensorflow-metal' instead."
    },
    "psycopg2-binary": {
        "min_version": "2.9.0",
        "fallback_message": "psycopg2-binary may not be available on all platforms. Consider installing PostgreSQL development libraries if needed."
    }
}

class Colors:
    """Cross-platform ANSI color codes"""
    def __init__(self):
        # Disable colors on Windows unless explicitly supported
        self.use_colors = (
            platform.system() != "Windows" or 
            os.getenv("FORCE_COLOR") == "1" or
            "ANSICON" in os.environ or
            "WT_SESSION" in os.environ  # Windows Terminal
        )
        
        if self.use_colors:
            self.HEADER = '\033[95m'
            self.OKBLUE = '\033[94m'
            self.OKCYAN = '\033[96m'
            self.OKGREEN = '\033[92m'
            self.WARNING = '\033[93m'
            self.FAIL = '\033[91m'
            self.ENDC = '\033[0m'
            self.BOLD = '\033[1m'
            self.UNDERLINE = '\033[4m'
        else:
            # No colors for unsupported terminals
            self.HEADER = self.OKBLUE = self.OKCYAN = ""
            self.OKGREEN = self.WARNING = self.FAIL = ""
            self.ENDC = self.BOLD = self.UNDERLINE = ""

def get_colors():
    """Get color instance"""
    return Colors()

def print_colored(message: str, color: str = ""):
    """Print colored message with cross-platform support"""
    colors = get_colors()
    if colors.use_colors and color:
        print(f"{color}{message}{colors.ENDC}")
    else:
        print(message)

def print_header(message: str):
    """Print header message"""
    colors = get_colors()
    print_colored(f"\n{'='*60}", colors.HEADER)
    print_colored(f"{message}", colors.HEADER)
    print_colored(f"{'='*60}", colors.HEADER)

def print_success(message: str):
    """Print success message"""
    colors = get_colors()
    symbol = "✅" if colors.use_colors else "[SUCCESS]"
    print_colored(f"{symbol} {message}", colors.OKGREEN)

def print_warning(message: str):
    """Print warning message"""
    colors = get_colors()
    symbol = "⚠️" if colors.use_colors else "[WARNING]"
    print_colored(f"{symbol} {message}", colors.WARNING)

def print_error(message: str):
    """Print error message"""
    colors = get_colors()
    symbol = "❌" if colors.use_colors else "[ERROR]"
    print_colored(f"{symbol} {message}", colors.FAIL)

def print_info(message: str):
    """Print info message"""
    colors = get_colors()
    symbol = "ℹ️" if colors.use_colors else "[INFO]"
    print_colored(f"{symbol} {message}", colors.OKCYAN)

def detect_platform():
    """Detect the current platform and return platform-specific information"""
    system = platform.system()
    version_info = platform.version()
    architecture = platform.architecture()[0]
    
    # Detect if we're in a virtual environment
    in_venv = (
        hasattr(sys, 'real_prefix') or  # virtualenv
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix) or  # venv
        os.environ.get('VIRTUAL_ENV') is not None  # any virtual environment
    )
    
    platform_info = {
        "system": system,
        "version": version_info,
        "architecture": architecture,
        "python_executable": sys.executable,
        "pip_command": [sys.executable, "-m", "pip"],
        "package_manager": "pip",
        "in_virtual_env": in_venv
    }
    
    # Platform-specific optimizations
    if system == "Windows":
        platform_info["shell"] = "cmd" if "cmd" in os.environ.get("COMSPEC", "") else "powershell"
        platform_info["path_separator"] = "\\"
    else:  # Linux, macOS, other Unix-like
        platform_info["shell"] = os.environ.get("SHELL", "/bin/bash")
        platform_info["path_separator"] = "/"
    
    return platform_info

def check_python_version():
    """Check if Python version meets requirements"""
    print_info("Checking Python version...")
    
    current_version = sys.version_info
    required_version = tuple(map(int, REQUIRED_PYTHON_VERSION.split('.')))
    
    if current_version >= required_version:
        print_success(f"Python {sys.version.split()[0]} meets requirements (>= {REQUIRED_PYTHON_VERSION})")
        return True
    else:
        print_error(f"Python {REQUIRED_PYTHON_VERSION} or higher is required. Current: {sys.version.split()[0]}")
        return False

def simple_package_check(package_name: str) -> bool:
    """Simple package check without version validation (fallback mode)"""
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False

def should_install_platform_sensitive_package(package_name: str) -> Tuple[bool, str]:
    """Check if a platform-sensitive package should be installed"""
    if package_name not in PLATFORM_SENSITIVE_PACKAGES:
        return True, ""
    
    pkg_info = PLATFORM_SENSITIVE_PACKAGES[package_name]
    current_python = sys.version_info[:2]
    
    # Check Python version compatibility
    if "supported_python" in pkg_info:
        if current_python not in pkg_info["supported_python"]:
            supported_versions = ", ".join([f"{v[0]}.{v[1]}" for v in pkg_info["supported_python"]])
            reason = f"Python {current_python[0]}.{current_python[1]} not supported for {package_name} (supported: {supported_versions})"
            return False, reason
    
    # Check platform compatibility
    if "unsupported_platforms" in pkg_info:
        current_platform = f"{platform.system().lower()}-{platform.machine().lower()}"
        if current_platform in pkg_info["unsupported_platforms"]:
            reason = f"Platform {current_platform} has known compatibility issues with {package_name}"
            return False, reason
    
    # Special handling for TensorFlow on newer Python versions
    if package_name == "tensorflow" and current_python >= (3, 12):
        reason = f"TensorFlow does not yet support Python {current_python[0]}.{current_python[1]} (requires 3.9-3.11)"
        return False, reason
    
    return True, ""

def is_package_installed(package_name: str, min_version: str = None, simple_mode: bool = False) -> bool:
    """Check if a package is installed with optional version check"""
    try:
        # In simple mode, just check if package can be imported
        if simple_mode or FALLBACK_MODE:
            return simple_package_check(package_name)
        
        # Handle built-in modules that don't need installation
        builtin_modules = [
            'sqlite3', 'pathlib', 'asyncio', 'datetime', 'hashlib', 
            'ipaddress', 'collections', 'functools', 'logging', 'json', 'os', 'sys'
        ]
        
        if package_name in builtin_modules:
            try:
                __import__(package_name)
                return True
            except ImportError:
                return False
        
        # Special handling for version-specific packages
        if package_name == 'dataclasses' and sys.version_info >= (3, 7):
            return True  # Built-in since Python 3.7
        
        if package_name == 'enum34' and sys.version_info >= (3, 4):
            return True  # Only needed for Python < 3.4
        
        # Use modern metadata API for version checking
        if HAS_METADATA:
            try:
                installed_version = metadata.version(package_name)
                
                if min_version:
                    # Use packaging.version if available, otherwise use simple comparison
                    if HAS_PACKAGING:
                        if version.parse(installed_version) >= version.parse(min_version):
                            return True
                        else:
                            print_warning(f"{package_name} {installed_version} installed, but {min_version} required")
                            return False
                    else:
                        if simple_version_compare(installed_version, min_version):
                            return True
                        else:
                            print_warning(f"{package_name} {installed_version} installed, but {min_version} required")
                            return False
                return True
            except (metadata.PackageNotFoundError, ImportError, ModuleNotFoundError):
                return False
        elif 'pkg_resources' in globals():
            # Fallback to pkg_resources if available (with warnings suppressed)
            try:
                installed_version = pkg_resources.get_distribution(package_name).version
                
                if min_version:
                    if HAS_PACKAGING:
                        if version.parse(installed_version) >= version.parse(min_version):
                            return True
                        else:
                            print_warning(f"{package_name} {installed_version} installed, but {min_version} required")
                            return False
                    else:
                        if simple_version_compare(installed_version, min_version):
                            return True
                        else:
                            print_warning(f"{package_name} {installed_version} installed, but {min_version} required")
                            return False
                return True
            except (pkg_resources.DistributionNotFound, ImportError, ModuleNotFoundError):
                return False
        else:
            # Fallback: try to import the package (no version checking)
            return simple_package_check(package_name)
        
    except Exception:
        return False

def simple_install_package(package_name: str) -> bool:
    """Simple package installation without advanced features"""
    try:
        print_info(f"Installing {package_name}...")
        platform_info = detect_platform()
        
        cmd = platform_info["pip_command"] + ["install", package_name, "--upgrade"]
        
        # Add --user flag only if NOT in virtual environment and on Windows
        if platform_info["system"] == "Windows" and not platform_info["in_virtual_env"]:
            cmd.extend(["--user"])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            timeout=180  # Shorter timeout for simple mode
        )
        
        print_success(f"Successfully installed {package_name}")
        return True
        
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        print_error(f"Failed to install {package_name}")
        return False
    except Exception as e:
        print_error(f"Unexpected error installing {package_name}: {str(e)}")
        return False

def install_package(package_name: str, min_version: str = None, timeout: int = 300, simple_mode: bool = False, is_optional: bool = False) -> bool:
    """Install a Python package using pip with cross-platform support"""
    try:
        # Use simple installation in fallback mode
        if simple_mode or FALLBACK_MODE:
            return simple_install_package(package_name)
        
        # Check platform compatibility for sensitive packages
        if is_optional:
            should_install, reason = should_install_platform_sensitive_package(package_name)
            if not should_install:
                print_warning(f"Skipping {package_name}: {reason}")
                if package_name in PLATFORM_SENSITIVE_PACKAGES:
                    print_info(PLATFORM_SENSITIVE_PACKAGES[package_name].get("fallback_message", ""))
                return True  # Return True to not fail the overall installation
        
        platform_info = detect_platform()
        
        if min_version:
            package_spec = f"{package_name}>={min_version}"
        else:
            package_spec = package_name
        
        print_info(f"Installing {package_spec}...")
        
        # Build pip command with platform-specific optimizations
        cmd = platform_info["pip_command"] + ["install", package_spec, "--upgrade"]
        
        # Add --user flag only if NOT in virtual environment and on Windows
        if platform_info["system"] == "Windows" and not platform_info["in_virtual_env"]:
            cmd.extend(["--user"])  # Install for current user on Windows (not in venv)
        
        # Execute with timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            timeout=timeout
        )
        
        print_success(f"Successfully installed {package_name}")
        return True
        
    except subprocess.TimeoutExpired:
        if is_optional:
            print_warning(f"Installation of optional package {package_name} timed out - skipping")
            return True  # Don't fail overall installation for optional packages
        else:
            print_error(f"Installation of {package_name} timed out after {timeout} seconds")
            return False
    except subprocess.CalledProcessError as e:
        if is_optional:
            print_warning(f"Failed to install optional package {package_name} - skipping")
            return True  # Don't fail overall installation for optional packages
        else:
            print_error(f"Failed to install {package_name}: {e.stderr}")
            return False
    except Exception as e:
        if is_optional:
            print_warning(f"Unexpected error installing optional package {package_name} - skipping")
            return True  # Don't fail overall installation for optional packages
        else:
            print_error(f"Unexpected error installing {package_name}: {str(e)}")
            return False

def bootstrap_essential_packages():
    """Install essential packages needed for the setup process"""
    platform_info = detect_platform()
    essential_packages = ["setuptools", "packaging"]
    
    # Add importlib_metadata for older Python versions
    if sys.version_info < (3, 8):
        essential_packages.append("importlib_metadata")
    
    print_info("Installing essential packages for setup...")
    
    for package in essential_packages:
        try:
            # Try to import first
            if package == "setuptools":
                import setuptools
            elif package == "packaging":
                import packaging
            elif package == "importlib_metadata":
                import importlib_metadata
            print_success(f"{package} already available")
        except ImportError:
            print_info(f"Installing {package}...")
            try:
                # Build command without --user flag in virtual environments
                cmd = platform_info["pip_command"] + ["install", package]
                if platform_info["system"] == "Windows" and not platform_info["in_virtual_env"]:
                    cmd.append("--user")
                
                subprocess.run(
                    cmd, 
                    capture_output=True, text=True, check=True, timeout=120
                )
                print_success(f"Successfully installed {package}")
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
                print_error(f"Failed to install {package}: {str(e)}")
                return False
    
    # Try to reload metadata packages if they weren't available before
    global HAS_METADATA, HAS_PACKAGING, HAS_ADVANCED_FEATURES
    if not HAS_METADATA or not HAS_PACKAGING:
        try:
            # Try modern importlib.metadata first
            from importlib import metadata
            from packaging import version
            HAS_METADATA = True
            HAS_PACKAGING = True
            HAS_ADVANCED_FEATURES = True
            print_success("importlib.metadata and packaging now available")
        except ImportError:
            try:
                # Fallback to importlib_metadata for older Python
                import importlib_metadata as metadata
                from packaging import version
                HAS_METADATA = True
                HAS_PACKAGING = True
                HAS_ADVANCED_FEATURES = True
                print_success("importlib_metadata and packaging now available")
            except ImportError:
                print_warning("Modern metadata packages still not available, using fallback methods")
                HAS_ADVANCED_FEATURES = False
    
    return True

def install_dependencies_simple_mode():
    """Install core dependencies in simple mode (minimal functionality)"""
    print_header("🔧 INSTALLING CORE DEPENDENCIES (Simple Mode)")
    
    platform_info = detect_platform()
    print_info(f"Detected platform: {platform_info['system']} {platform_info['architecture']}")
    print_info("Running in simple mode - installing minimal dependencies only")
    
    # Update pip first
    print_info("Updating pip...")
    try:
        subprocess.run(
            platform_info["pip_command"] + ["install", "--upgrade", "pip"], 
            capture_output=True, text=True, check=True, timeout=60
        )
        print_success("pip updated successfully")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        print_warning("Could not update pip, continuing with current version")
    
    # Install core packages only
    print_info("Installing core packages...")
    failed_packages = []
    
    for package, min_ver in CORE_PACKAGES.items():
        if not is_package_installed(package, None, simple_mode=True):  # No version check in simple mode
            if not simple_install_package(package):
                failed_packages.append(package)
        else:
            print_success(f"{package} already installed")
    
    if failed_packages:
        print_warning(f"Some packages failed to install: {', '.join(failed_packages)}")
        print_warning("Continuing with available packages...")
    else:
        print_success("All core dependencies installed successfully!")
    
    return True

def install_dependencies(include_optional: bool = False, simple_mode: bool = False):
    """Install all required and optionally optional dependencies"""
    global FALLBACK_MODE
    
    if simple_mode:
        FALLBACK_MODE = True
        return install_dependencies_simple_mode()
    
    print_header("🔧 INSTALLING DEPENDENCIES")
    
    platform_info = detect_platform()
    print_info(f"Detected platform: {platform_info['system']} {platform_info['architecture']}")
    
    # Bootstrap essential packages first
    if not bootstrap_essential_packages():
        print_warning("Failed to install essential packages, switching to simple mode")
        FALLBACK_MODE = True
        return install_dependencies_simple_mode()
    
    # Update pip first
    print_info("Updating pip...")
    try:
        subprocess.run(
            platform_info["pip_command"] + ["install", "--upgrade", "pip"], 
            capture_output=True, text=True, check=True, timeout=60
        )
        print_success("pip updated successfully")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        print_warning("Could not update pip, continuing with current version")
    
    # Install required packages
    print_info("Installing required packages...")
    failed_packages = []
    
    packages_to_install = REQUIRED_PACKAGES if HAS_ADVANCED_FEATURES else CORE_PACKAGES
    
    for package, min_ver in packages_to_install.items():
        if not is_package_installed(package, min_ver):
            if not install_package(package, min_ver):
                failed_packages.append(package)
        else:
            print_success(f"{package} already installed")
    
    if failed_packages:
        if HAS_ADVANCED_FEATURES and len(failed_packages) > len(packages_to_install) // 2:
            print_warning("Many packages failed, switching to simple mode")
            FALLBACK_MODE = True
            return install_dependencies_simple_mode()
        else:
            print_warning(f"Some packages failed to install: {', '.join(failed_packages)}")
    
    # Install optional packages if requested
    if include_optional and HAS_ADVANCED_FEATURES and not FALLBACK_MODE:
        print_info("Installing optional packages...")
        optional_installed = 0
        optional_skipped = 0
        
        for package, min_ver in OPTIONAL_PACKAGES.items():
            if not is_package_installed(package, min_ver):
                result = install_package(package, min_ver, is_optional=True)
                if result:
                    # Check if it was actually installed or just skipped
                    if is_package_installed(package, None, simple_mode=True):  # Simple check for optional packages
                        optional_installed += 1
                    else:
                        optional_skipped += 1
                else:
                    optional_skipped += 1
            else:
                print_success(f"{package} already installed")
                optional_installed += 1
        
        if optional_installed > 0:
            print_success(f"Successfully installed {optional_installed} optional packages")
        if optional_skipped > 0:
            print_info(f"Skipped {optional_skipped} optional packages due to compatibility issues")
    
    if not failed_packages:
        print_success("All dependencies installed successfully!")
    else:
        print_success("Core dependencies installed successfully!")
    
    return True

def create_directory_structure():
    """Create necessary directory structure"""
    print_header("📁 CREATING DIRECTORY STRUCTURE")
    
    directories = [
        "dashboards",
        "data",
        "scripts",
        "docs",
        "config",
        "logs",
        "reports/dashboards/ceo",
        "reports/dashboards/cfo",
        "reports/dashboards/cto",
        "reports/dashboards/cco",
        "reports/dashboards/ciso",
        "backups"
    ]
    
    for directory in directories:
        dir_path = GOVERNANCE_DIR / directory
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            print_success(f"Created directory: {directory}")
        else:
            print_info(f"Directory already exists: {directory}")

def create_configuration_files(simple_mode: bool = False):
    """Create initial configuration files"""
    print_header("⚙️ CREATING CONFIGURATION FILES")
    
    # Create governance configuration
    config_content = {
        "dashboards": {
            "ceo": {
                "name": "CEO Strategic Dashboard",
                "script_path": "dashboards/ceo_dashboard.py",
                "enabled": True,
                "schedule_cron": "0 8 * * *",
                "timeout_minutes": 15
            },
            "cfo": {
                "name": "CFO Financial Dashboard", 
                "script_path": "dashboards/cfo_dashboard.py",
                "enabled": True,
                "schedule_cron": "0 9 * * *",
                "timeout_minutes": 10
            },
            "cto": {
                "name": "CTO Technical Dashboard",
                "script_path": "dashboards/cto_dashboard.py", 
                "enabled": True,
                "schedule_cron": "*/30 * * * *",
                "timeout_minutes": 10
            },
            "cco": {
                "name": "CCO Compliance Dashboard",
                "script_path": "dashboards/cco_dashboard.py",
                "enabled": True,
                "schedule_cron": "0 10 * * *",
                "timeout_minutes": 12
            },
            "ciso": {
                "name": "CISO Security Dashboard",
                "script_path": "dashboards/ciso_dashboard.py",
                "enabled": True,
                "schedule_cron": "*/15 * * * *",
                "timeout_minutes": 8
            },
            "unified": {
                "name": "Unified Governance Dashboard",
                "script_path": "dashboards/unified_dashboard.py",
                "enabled": True,
                "schedule_cron": "0 11 * * *",
                "timeout_minutes": 20,
                "dependencies": ["ceo", "cfo", "cto", "cco", "ciso"]
            }
        },
        "platform": detect_platform(),
        "setup_timestamp": str(datetime.datetime.now()),
        "setup_mode": "simple" if (simple_mode or FALLBACK_MODE) else "full"
    }
    
    # Write configuration (prefer YAML, fallback to JSON)
    try:
        if not simple_mode and not FALLBACK_MODE:
            import yaml
            config_path = GOVERNANCE_DIR / "config" / "governance_config.yaml"
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.dump(config_content, f, default_flow_style=False, indent=2)
            print_success(f"Created configuration file: {config_path.name}")
        else:
            raise ImportError("Using JSON fallback")
    except ImportError:
        # Fallback to JSON
        config_path = GOVERNANCE_DIR / "config" / "governance_config.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_content, f, indent=2)
        print_success(f"Created configuration file: {config_path.name}")
    
    # Create environment template
    env_content = """# Meqenet.et Governance Framework Environment Variables
# Copy this to .env and customize for your environment

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost/meqenet_governance

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=governance@meqenet.et
SMTP_PASSWORD=your_app_password_here

# Notification Configuration  
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK

# Ethiopian NBE Configuration
NBE_API_KEY=your_nbe_api_key_here
NBE_API_URL=https://api.nbe.gov.et/

# Security Configuration
ENCRYPTION_KEY=generate_a_secure_key_here
JWT_SECRET=generate_a_jwt_secret_here

# Feature Flags
ENABLE_ML_FEATURES=true
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_REAL_TIME_MONITORING=true
"""
    
    env_path = GOVERNANCE_DIR / ".env.template"
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(env_content)
    print_success(f"Created environment template: {env_path.name}")

def create_quick_start_script():
    """Create a cross-platform quick start script"""
    print_header("🚀 CREATING QUICK START SCRIPT")
    
    quick_start_content = f'''#!/usr/bin/env python3
"""
Meqenet.et Governance Framework Quick Start
Cross-platform launcher for the governance suite
"""

import sys
import subprocess
from pathlib import Path

def main():
    print("🏛️  Meqenet.et Governance Framework")
    print("=" * 50)
    print()
    print("Choose an option:")
    print("1. Run all dashboards once")
    print("2. Run specific dashboard") 
    print("3. Start scheduled execution")
    print("4. View latest reports")
    print("5. Check system status")
    print("6. Exit")
    print()
    
    choice = input("Enter your choice (1-6): ").strip()
    
    governance_dir = Path(__file__).parent / "governance"
    deploy_script = governance_dir / "orchestrator.py"
    
    if choice == "1":
        print("\\n🎯 Running all dashboards...")
        subprocess.run([sys.executable, str(deploy_script), "--mode", "run"])
    
    elif choice == "2":
        dashboard = input("Enter dashboard (ceo/cfo/cto/cco/ciso): ").strip().lower()
        if dashboard in ["ceo", "cfo", "cto", "cco", "ciso"]:
            print(f"\\n🎯 Running {{dashboard.upper()}} dashboard...")
            subprocess.run([sys.executable, str(deploy_script), "--mode", "run", "--dashboard", dashboard])
        else:
            print("❌ Invalid dashboard name")
    
    elif choice == "3":
        print("\\n🕒 Starting scheduled execution...")
        print("Press Ctrl+C to stop")
        subprocess.run([sys.executable, str(deploy_script), "--mode", "schedule"])
    
    elif choice == "4":
        print("\\n📄 Latest reports:")
        reports_dir = governance_dir / "reports"
        if reports_dir.exists():
            reports = sorted(reports_dir.glob("*.md"), key=lambda x: x.stat().st_mtime, reverse=True)
            for i, report in enumerate(reports[:5], 1):
                print(f"{{i}}. {{report.name}}")
        else:
            print("No reports found. Run dashboards first.")
    
    elif choice == "5":
        print("\\n📊 System status:")
        try:
            import yaml, pandas, numpy
            print("✅ Dependencies: OK")
        except ImportError as e:
            print(f"❌ Missing dependencies: {{e}}")
        
        config_file = governance_dir / "config" / "governance_config.yaml"
        if config_file.exists():
            print("✅ Configuration: OK")
        else:
            print("❌ Configuration: Missing")
    
    elif choice == "6":
        print("👋 Goodbye!")
        sys.exit(0)
    
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
'''
    
    quick_start_path = PROJECT_ROOT / "quick_start.py"
    with open(quick_start_path, 'w', encoding='utf-8') as f:
        f.write(quick_start_content)
    
    print_success(f"Created quick start script: {quick_start_path.name}")

def validate_installation():
    """Validate that the installation is working correctly"""
    print_header("✅ VALIDATING INSTALLATION")
    
    validation_passed = True
    
    # Check Python version
    if not check_python_version():
        validation_passed = False
    
    # Check packages (adapt for simple mode)
    print_info("Validating packages...")
    if FALLBACK_MODE:
        packages_to_check = CORE_PACKAGES
        print_info("Validating core packages (simple mode)...")
    else:
        packages_to_check = REQUIRED_PACKAGES
        print_info("Validating required packages...")
    
    missing_packages = []
    for package, min_ver in packages_to_check.items():
        if not is_package_installed(package, min_ver if not FALLBACK_MODE else None, simple_mode=FALLBACK_MODE):
            missing_packages.append(package)
    
    if missing_packages:
        print_error(f"Missing packages: {', '.join(missing_packages)}")
        validation_passed = False
    else:
        print_success("All required packages are available")
    
    # Check directory structure
    print_info("Validating directory structure...")
    required_dirs = ["config", "logs", "dashboards", "data", "scripts", "docs", "reports"]
    missing_dirs = []
    for directory in required_dirs:
        if not (GOVERNANCE_DIR / directory).exists():
            missing_dirs.append(directory)
    
    if missing_dirs:
        print_error(f"Missing directories: {', '.join(missing_dirs)}")
        validation_passed = False
    else:
        print_success("Directory structure is valid")
    
    # Check configuration files
    print_info("Validating configuration...")
    config_files = ["config/governance_config.yaml", "config/governance_config.json"]
    config_exists = any((GOVERNANCE_DIR / cf).exists() for cf in config_files)
    
    if not config_exists:
        print_error("Configuration file not found")
        validation_passed = False
    else:
        print_success("Configuration file found")
    
    return validation_passed

def uninstall_governance():
    """Remove the governance framework (with confirmation)"""
    print_header("🗑️ UNINSTALLING GOVERNANCE FRAMEWORK")
    
    print_warning("This will remove all governance framework files and configurations.")
    print_warning("Reports and logs will be backed up to governance_backup/ before removal.")
    
    response = input("Are you sure you want to continue? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print_info("Uninstall cancelled.")
        return
    
    try:
        # Create backup
        backup_dir = PROJECT_ROOT / "governance_backup"
        if GOVERNANCE_DIR.exists():
            print_info("Creating backup...")
            shutil.copytree(GOVERNANCE_DIR, backup_dir, dirs_exist_ok=True)
            print_success(f"Backup created: {backup_dir}")
        
        # Remove governance directory
        if GOVERNANCE_DIR.exists():
            shutil.rmtree(GOVERNANCE_DIR)
            print_success("Governance framework removed")
        
        # Remove quick start script
        quick_start = PROJECT_ROOT / "quick_start.py"
        if quick_start.exists():
            quick_start.unlink()
            print_success("Quick start script removed")
        
        print_success("Uninstall completed successfully!")
        print_info(f"Backup available at: {backup_dir}")
        
    except Exception as e:
        print_error(f"Uninstall failed: {str(e)}")

def print_next_steps():
    """Print next steps for the user"""
    print_header("🎯 NEXT STEPS")
    
    colors = get_colors()
    
    if FALLBACK_MODE:
        print_colored("Your Meqenet.et Governance Framework is ready! (Simple Mode)", colors.OKGREEN)
        print_warning("Running in simple mode with basic functionality.")
        print_warning("For full features, install missing dependencies and re-run setup.")
    else:
        print_colored("Your Meqenet.et Governance Framework is ready!", colors.OKGREEN)
    
    print()
    print_colored("Quick Start Options:", colors.OKBLUE)
    print("1. 🚀 Run the quick start script:")
    print_colored("   python quick_start.py", colors.BOLD)
    print()
    print("2. 🎯 Run all dashboards:")
    print_colored("   python governance/orchestrator.py --mode run", colors.BOLD)
    print()
    print("3. 🔧 Run specific dashboard:")
    print_colored("   python governance/orchestrator.py --dashboard ceo", colors.BOLD)
    print()
    print("4. 🕒 Start scheduled execution:")
    print_colored("   python governance/orchestrator.py --mode schedule", colors.BOLD)
    print()
    print_colored("Configuration:", colors.OKBLUE)
    config_file = "governance_config.yaml" if not FALLBACK_MODE else "governance_config.json"
    print(f"• Edit governance/config/{config_file} for dashboard settings")
    print("• Copy governance/.env.template to governance/.env for environment variables")
    print("• Check governance/README.md for comprehensive documentation")
    print()
    print_colored("Optional Features:", colors.OKBLUE)
    print("• To install optional ML/AI packages: python setup.py --include-optional")
    print("• Some packages (like TensorFlow) may be skipped due to platform/Python version compatibility")
    print("• This is normal and doesn't affect core governance functionality")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Meqenet.et Governance Framework Setup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup.py                    # Interactive setup
  python setup.py --quick           # Quick setup with defaults
  python setup.py --simple          # Simple installation (minimal dependencies)
  python setup.py --validate        # Validate installation
  python setup.py --uninstall       # Remove governance framework
        """
    )
    
    parser.add_argument(
        "--quick", 
        action="store_true",
        help="Quick setup with default options (no prompts)"
    )
    
    parser.add_argument(
        "--simple", 
        action="store_true",
        help="Simple installation with minimal dependencies (fallback mode)"
    )
    
    parser.add_argument(
        "--validate", 
        action="store_true",
        help="Validate existing installation"
    )
    
    parser.add_argument(
        "--uninstall", 
        action="store_true",
        help="Remove governance framework"
    )
    
    parser.add_argument(
        "--include-optional", 
        action="store_true",
        help="Install optional packages (ML/AI features)"
    )
    
    parser.add_argument(
        "--force",
        action="store_true", 
        help="Force installation even if already exists"
    )
    
    return parser.parse_args()

def main():
    """Main setup function with argument parsing"""
    global FALLBACK_MODE
    
    # Initial notification about missing packages
    if not HAS_METADATA or not HAS_PACKAGING:
        print_info("Note: Some setup packages are missing, will install them first")
    
    args = parse_arguments()
    
    # Set simple mode if requested
    if args.simple:
        FALLBACK_MODE = True
        print_info("Running in simple mode - minimal dependencies only")
    
    # Handle special modes
    if args.validate:
        if validate_installation():
            print_success("Installation validation passed!")
            return 0
        else:
            print_error("Installation validation failed!")
            return 1
    
    if args.uninstall:
        uninstall_governance()
        return 0
    
    # Main setup process
    print_header("🏛️ MEQENET.ET GOVERNANCE FRAMEWORK SETUP")
    if FALLBACK_MODE:
        print_colored("Enterprise-Grade C-Suite Dashboard Installation (Simple Mode)", get_colors().HEADER)
    else:
        print_colored("Enterprise-Grade C-Suite Dashboard Installation", get_colors().HEADER)
    
    platform_info = detect_platform()
    print_info(f"Platform: {platform_info['system']} {platform_info['architecture']}")
    print_info(f"Python: {sys.version.split()[0]}")
    
    # Check if already set up
    config_file = GOVERNANCE_DIR / "config" / "governance_config.yaml"
    config_file_json = GOVERNANCE_DIR / "config" / "governance_config.json"
    
    if (config_file.exists() or config_file_json.exists()) and not args.force:
        if not args.quick:
            print_warning("Governance framework appears to already be set up.")
            response = input("Do you want to proceed anyway? (y/N): ").strip().lower()
            if response not in ['y', 'yes']:
                print_info("Setup cancelled by user")
                return 0
    
    try:
        # Step 1: Check Python version
        if not check_python_version():
            print_error("Python version check failed. Please upgrade Python and try again.")
            return 1
        
        # Step 2: Install dependencies
        include_optional = args.include_optional
        if not args.quick and not include_optional and not FALLBACK_MODE:
            response = input("\\nInstall optional packages for enhanced features? (y/N): ").strip().lower()
            include_optional = response in ['y', 'yes']
        
        if not install_dependencies(include_optional, simple_mode=FALLBACK_MODE):
            print_error("Dependency installation failed. Please check the errors above.")
            return 1
        
        # Step 3: Create directory structure
        create_directory_structure()
        
        # Step 4: Create configuration files
        create_configuration_files(simple_mode=FALLBACK_MODE)
        
        # Step 5: Create quick start script
        create_quick_start_script()
        
        # Step 6: Validate installation
        if validate_installation():
            print_header("🎉 SETUP COMPLETED SUCCESSFULLY!")
            print_next_steps()
            return 0
        else:
            print_error("Setup completed with some issues. Please review the errors above.")
            return 1
    
    except KeyboardInterrupt:
        print_error("\\nSetup interrupted by user")
        return 1
    except Exception as e:
        print_error(f"Setup failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main()) 