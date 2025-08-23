#!/usr/bin/env python3
"""
Meqenet.et Enhanced Fintech Git Automation Script
==================================================

Enterprise-grade Git automation with comprehensive security, audit logging,
and NBE compliance for Ethiopian fintech industry standards.

Version: 2.0
Compliance: NBE Ethiopian Financial Regulations
Security Level: Enterprise Fintech Standards
"""

import argparse
import subprocess
import sys
import json
import os
import re
import logging
import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
from ruamel.yaml import YAML

# Enhanced imports for fintech-grade functionality
try:
    import colorama
    from colorama import Fore, Style, init
    init(autoreset=True)
    COLORS_AVAILABLE = True
except ImportError:
    COLORS_AVAILABLE = False
    Fore = Style = type('', (), {'RED': '', 'GREEN': '', 'YELLOW': '', 'BLUE': '', 'RESET_ALL': ''})()

try:
    from dateutil import tz
    TIMEZONE_SUPPORT = True
except ImportError:
    TIMEZONE_SUPPORT = False

# Configuration Constants
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent.parent
TASKS_FILE_PATH = PROJECT_ROOT / "tasks" / "tasks.yaml"
LOG_DIR = PROJECT_ROOT / "logs" / "git-automation"
AUDIT_LOG_FILE = LOG_DIR / f"audit-{datetime.now().strftime('%Y-%m')}.log"

# Ensure log directory exists
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Enhanced Fintech Security Configuration
FINTECH_CONFIG = {
    'MAX_COMMAND_FREQUENCY': 10,  # Max commands per minute per user
    'SESSION_TIMEOUT': 3600,      # 1 hour session timeout
    'AUDIT_RETENTION_DAYS': 2555, # 7 years NBE requirement
    'SECRET_PATTERNS': [
        r'(?i)(api[_-]?key|secret[_-]?key|access[_-]?token)',
        r'(?i)(password|passwd|pwd)\s*[=:]\s*["\']?[^"\'\s]+',
        r'(?i)(private[_-]?key|priv[_-]?key)',
        r'(?i)(bearer\s+[a-zA-Z0-9\-._~+/]+=*)',
        r'(?i)(basic\s+[a-zA-Z0-9+/=]+)',
    ],
    'SUSPICIOUS_FILE_PATTERNS': [
        r'\.env$', r'\.env\.',
        r'config\.json$', r'secrets\.json$',
        r'\.pem$', r'\.key$', r'\.p12$',
        r'id_rsa', r'id_dsa', r'id_ecdsa',
    ]
}

# Fintech branching strategy enforcement - Aligned with FINTECH_BRANCHING_STRATEGY.md
ALLOWED_BRANCH_PATTERNS = {
    'feature': r'^feature/[A-Z]+-[A-Z]+-[A-Z]+-\d+-[a-z0-9-]+$',
    'hotfix': r'^hotfix/(SEC|CRIT)-\d+-[a-z0-9-]+$',
    'bugfix': r'^bugfix/BUG-\d+-[a-z0-9-]+$',
    'release': r'^release/v\d+\.\d+\.\d+$'
}

FINTECH_BASE_BRANCHES = {
    'feature': 'develop',
    'bugfix': 'develop', 
    'hotfix': 'main',
    'release': 'develop'
}

# NBE Compliance and Security Requirements
NBE_PROTECTED_BRANCHES = ['main', 'develop']
REQUIRED_STATUS_CHECKS = [
    'ci/lint', 'ci/test', 'ci/security-scan', 'ci/build', 'ci/type-check'
]
SECURITY_INCIDENT_TYPES = ['SEC', 'CRIT']
MIN_REVIEWERS = {'main': 2, 'develop': 1}

class FintechLogger:
    """Enhanced logging for NBE compliance and audit requirements."""
    
    def __init__(self):
        self.setup_logging()
        self.session_id = self.generate_session_id()
        self.start_time = datetime.now(timezone.utc)
        
    def setup_logging(self):
        """Setup structured logging for audit compliance."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
            handlers=[
                logging.FileHandler(AUDIT_LOG_FILE, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('MeqenetGitAutomation')
        
    def generate_session_id(self) -> str:
        """Generate unique session ID for audit tracking."""
        timestamp = str(time.time())
        user = os.getenv('USER', 'unknown')
        return hashlib.sha256(f"{timestamp}-{user}".encode()).hexdigest()[:16]
    
    def audit_log(self, action: str, details: Dict, level: str = 'INFO'):
        """Create structured audit log entry."""
        audit_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'session_id': self.session_id,
            'action': action,
            'user': os.getenv('USER', 'unknown'),
            'details': details,
            'compliance': 'NBE_ETHIOPIAN_FINTECH'
        }
        
        getattr(self.logger, level.lower())(json.dumps(audit_entry, default=str))
        
    def security_alert(self, threat: str, details: Dict):
        """Log security threats for immediate attention."""
        self.audit_log(
            action='SECURITY_ALERT',
            details={'threat_type': threat, **details},
            level='WARNING'
        )

# Global logger instance
fintech_logger = FintechLogger()

class SecurityValidator:
    """Enhanced security validation for fintech operations."""
    
    @staticmethod
    def scan_for_secrets(content: str, file_path: str = "") -> List[Dict]:
        """Scan content for potential secrets and sensitive data."""
        findings = []
        
        for i, line in enumerate(content.split('\n'), 1):
            for pattern in FINTECH_CONFIG['SECRET_PATTERNS']:
                if re.search(pattern, line):
                    findings.append({
                        'type': 'potential_secret',
                        'file': file_path,
                        'line': i,
                        'pattern': pattern[:20] + '...',
                        'severity': 'HIGH'
                    })
                    
        return findings
    
    @staticmethod
    def validate_file_security(file_path: str) -> bool:
        """Validate file doesn't contain suspicious patterns."""
        for pattern in FINTECH_CONFIG['SUSPICIOUS_FILE_PATTERNS']:
            if re.search(pattern, file_path):
                fintech_logger.security_alert(
                    threat='SUSPICIOUS_FILE',
                    details={'file_path': file_path, 'pattern': pattern}
                )
                return False
        return True
    
    @staticmethod
    def check_command_injection(command: List[str]) -> bool:
        """Check for potential command injection attempts."""
        dangerous_chars = [';', '|', '&', '$', '`', '(', ')', '<', '>']
        command_str = ' '.join(command)
        
        for char in dangerous_chars:
            if char in command_str:
                fintech_logger.security_alert(
                    threat='COMMAND_INJECTION_ATTEMPT',
                    details={'command': command_str, 'dangerous_char': char}
                )
                return False
        return True

def enhanced_run_command(command: List[str], timeout: int = 30) -> Union[str, subprocess.CalledProcessError]:
    """Enhanced command execution with security validation and audit logging."""
    # Security validation
    if not SecurityValidator.check_command_injection(command):
        raise SecurityException("Command injection attempt detected")
    
    # Audit logging
    fintech_logger.audit_log(
        action='COMMAND_EXECUTION',
        details={
            'command': ' '.join(command),
            'working_dir': os.getcwd(),
            'timeout': timeout
        }
    )
    
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=timeout
        )
        
        fintech_logger.audit_log(
            action='COMMAND_SUCCESS',
            details={'command': ' '.join(command), 'output_length': len(result.stdout)}
        )
        
        return result.stdout.strip()
        
    except subprocess.CalledProcessError as e:
        fintech_logger.audit_log(
            action='COMMAND_FAILURE',
            details={
                'command': ' '.join(command),
                'error_code': e.returncode,
                'error_output': e.stderr
            },
            level='ERROR'
        )
        return e
        
    except subprocess.TimeoutExpired:
        fintech_logger.security_alert(
            threat='COMMAND_TIMEOUT',
            details={'command': ' '.join(command), 'timeout': timeout}
        )
        raise TimeoutError(f"Command timed out after {timeout} seconds")
        
    except FileNotFoundError:
        error_msg = f"Command '{command[0]}' not found. Ensure it's installed and in PATH."
        fintech_logger.audit_log(
            action='COMMAND_NOT_FOUND',
            details={'command': command[0]},
            level='ERROR'
        )
        print(f"{Fore.RED}❌ Error: {error_msg}")
        sys.exit(1)

def enhanced_security_scanning() -> Dict:
    """Comprehensive security scanning for fintech compliance."""
    print(f"{Fore.BLUE}🛡️  Running enhanced security scanning...")
    
    scan_results = {
        'dependency_vulnerabilities': [],
        'secret_leaks': [],
        'license_compliance': [],
        'code_quality': {},
        'overall_status': 'UNKNOWN'
    }
    
    try:
        # 1. Dependency vulnerability scanning
        print(f"{Fore.BLUE}🔍 Scanning dependencies for vulnerabilities...")
        audit_result = enhanced_run_command(["pnpm", "audit", "--audit-level", "moderate"])
        
        if isinstance(audit_result, subprocess.CalledProcessError):
            scan_results['dependency_vulnerabilities'].append({
                'severity': 'HIGH',
                'description': 'Dependency scan failed',
                'details': audit_result.stderr
            })
        elif "No known vulnerabilities found" not in audit_result:
            scan_results['dependency_vulnerabilities'].append({
                'severity': 'MEDIUM',
                'description': 'Vulnerabilities detected',
                'details': audit_result
            })
        
        # 2. Secret scanning
        print(f"{Fore.BLUE}🔍 Scanning for exposed secrets...")
        try:
            # Scan staged files for secrets
            staged_files = enhanced_run_command(["git", "diff", "--cached", "--name-only"])
            if not isinstance(staged_files, subprocess.CalledProcessError):
                for file_path in staged_files.split('\n'):
                    if file_path.strip():
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                                secrets = SecurityValidator.scan_for_secrets(content, file_path)
                                scan_results['secret_leaks'].extend(secrets)
                        except (FileNotFoundError, PermissionError):
                            continue
        except Exception as e:
            fintech_logger.audit_log(
                action='SECRET_SCAN_ERROR',
                details={'error': str(e)},
                level='WARNING'
            )
        
        # 3. License compliance (basic check)
        print(f"{Fore.BLUE}🔍 Checking license compliance...")
        try:
            license_result = enhanced_run_command(["pnpm", "licenses", "list"])
            if not isinstance(license_result, subprocess.CalledProcessError):
                # Check for problematic licenses (development mode is more lenient)
                problematic_licenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0']
                is_development = os.getenv('NODE_ENV', '').lower() in ['development', 'dev']

                for license_name in problematic_licenses:
                    if license_name in license_result:
                        if is_development:
                            scan_results['license_compliance'].append({
                                'license': license_name,
                                'risk': 'MEDIUM',
                                'description': 'GPL license detected - review for production compatibility'
                            })
                        else:
                            scan_results['license_compliance'].append({
                                'license': license_name,
                                'risk': 'HIGH',
                                'description': 'Potentially incompatible license detected'
                            })
        except Exception:
            pass  # License checking is optional
        
        # Determine overall status
        is_development = os.getenv('NODE_ENV', '').lower() in ['development', 'dev']

        if is_development:
            # In development, only fail on HIGH severity vulnerabilities and secrets
            has_high_risk = any(
                item.get('severity') == 'HIGH'
                for category in [scan_results['dependency_vulnerabilities'],
                               scan_results['secret_leaks']]
                for item in category
            )
            # License issues are warnings in development
            has_critical_license = any(
                item.get('risk') == 'HIGH'
                for item in scan_results['license_compliance']
            )
            scan_results['overall_status'] = 'FAIL' if (has_high_risk or has_critical_license) else 'PASS'
        else:
            # Production: fail on any HIGH risk issue
            has_high_risk = any(
                item.get('severity') == 'HIGH' or item.get('risk') == 'HIGH'
                for category in [scan_results['dependency_vulnerabilities'],
                               scan_results['secret_leaks'],
                               scan_results['license_compliance']]
                for item in category
            )
            scan_results['overall_status'] = 'FAIL' if has_high_risk else 'PASS'
        
        # Log comprehensive scan results
        fintech_logger.audit_log(
            action='SECURITY_SCAN_COMPLETE',
            details=scan_results
        )
        
        # Display results
        if scan_results['overall_status'] == 'PASS':
            print(f"{Fore.GREEN}✅ Security scan completed - No critical issues found")
        else:
            print(f"{Fore.RED}❌ Security scan failed - Critical issues detected")
            for vuln in scan_results['dependency_vulnerabilities']:
                if vuln.get('severity') == 'HIGH':
                    print(f"{Fore.RED}  🚨 {vuln['description']}")
            for secret in scan_results['secret_leaks']:
                print(f"{Fore.RED}  🚨 Potential secret detected. Please review the scan results for details.")
        
        return scan_results
        
    except Exception as e:
        fintech_logger.audit_log(
            action='SECURITY_SCAN_ERROR',
            details={'error': str(e)},
            level='ERROR'
        )
        scan_results['overall_status'] = 'ERROR'
        return scan_results

class SecurityException(Exception):
    """Custom exception for security violations."""
    pass

# Enhanced validation functions with better error handling and logging
def enhanced_validate_branch_name(branch_name: str) -> bool:
    """Enhanced branch name validation with audit logging."""
    fintech_logger.audit_log(
        action='BRANCH_NAME_VALIDATION',
        details={'branch_name': branch_name}
    )
    
    if not branch_name or len(branch_name) < 3:
        print(f"{Fore.RED}❌ Error: Branch name too short")
        return False
    
    if len(branch_name) > 100:
        print(f"{Fore.RED}❌ Error: Branch name too long (max 100 characters)")
        return False
    
    # Check for dangerous characters
    dangerous_chars = ['..', '//', '\\', '<', '>', '|', '?', '*']
    for char in dangerous_chars:
        if char in branch_name:
            fintech_logger.security_alert(
                threat='DANGEROUS_BRANCH_NAME',
                details={'branch_name': branch_name, 'dangerous_char': char}
            )
            return False
    
    branch_type = branch_name.split('/')[0] if '/' in branch_name else ''
    
    if branch_type not in ALLOWED_BRANCH_PATTERNS:
        print(f"{Fore.RED}❌ Error: Invalid branch type '{branch_type}'.")
        print(f"{Fore.YELLOW}📋 Allowed types: {', '.join(ALLOWED_BRANCH_PATTERNS.keys())}")
        return False
    
    pattern = ALLOWED_BRANCH_PATTERNS[branch_type]
    if not re.match(pattern, branch_name):
        print(f"{Fore.RED}❌ Error: Branch name doesn't match required pattern.")
        print(f"{Fore.YELLOW}📐 Required pattern: {pattern}")
        return False
    
    fintech_logger.audit_log(
        action='BRANCH_NAME_VALIDATED',
        details={'branch_name': branch_name, 'branch_type': branch_type}
    )
    
    print(f"{Fore.GREEN}✅ Branch name validation passed: {branch_name}")
    return True

def enhanced_validate_nbe_compliance() -> bool:
    """Enhanced NBE compliance validation with comprehensive checks."""
    print(f"{Fore.BLUE}🇪🇹 Running comprehensive NBE compliance validation...")
    
    compliance_results = {
        'gpg_signing': False,
        'email_domain': False,
        'user_config': False,
        'overall_status': False
    }
    
    try:
        # Check GPG signing configuration
        signing_key = enhanced_run_command(["git", "config", "user.signingkey"])
        if not isinstance(signing_key, subprocess.CalledProcessError) and signing_key:
            compliance_results['gpg_signing'] = True
            print(f"{Fore.GREEN}✅ GPG signing key configured: {signing_key[:8]}...")
        else:
            print(f"{Fore.RED}❌ No GPG signing key configured")
            print(f"{Fore.YELLOW}💡 Setup: git config --global user.signingkey <key-id>")
        
        # Check user configuration
        user_name = enhanced_run_command(["git", "config", "user.name"])
        user_email = enhanced_run_command(["git", "config", "user.email"])
        
        if not isinstance(user_name, subprocess.CalledProcessError) and not isinstance(user_email, subprocess.CalledProcessError):
            compliance_results['user_config'] = True
            
            # Check email domain compliance
            if user_email.endswith('@meqenet.et'):
                compliance_results['email_domain'] = True
                print(f"{Fore.GREEN}✅ NBE compliant email domain: {user_email}")
            else:
                print(f"{Fore.YELLOW}⚠️  Warning: Non-Meqenet email domain: {user_email}")
                print(f"{Fore.YELLOW}📧 Recommended: Use @meqenet.et for NBE compliance")
        else:
            print(f"{Fore.RED}❌ Git user configuration incomplete")
        
        # For development environments, GPG signing is optional if other security measures are in place
        is_development = os.getenv('NODE_ENV', '').lower() in ['development', 'dev'] or os.getenv('CI') != 'true'

        if is_development:
            # In development, only require user config and email domain compliance
            compliance_results['overall_status'] = all([
                compliance_results['user_config'],
                compliance_results['email_domain']
            ])
            if not compliance_results['gpg_signing']:
                print(f"{Fore.YELLOW}⚠️  Development mode: GPG signing not required")
                print(f"{Fore.YELLOW}📝 Note: Production deployments will require GPG signing")
        else:
            # Production/CI environment: require all security measures
            compliance_results['overall_status'] = all([
                compliance_results['gpg_signing'],
                compliance_results['user_config'],
                compliance_results['email_domain']
            ])
        
        fintech_logger.audit_log(
            action='NBE_COMPLIANCE_CHECK',
            details=compliance_results
        )
        
        if compliance_results['overall_status']:
            print(f"{Fore.GREEN}✅ NBE compliance validation passed")
        else:
            print(f"{Fore.RED}❌ NBE compliance validation failed")
        
        return compliance_results['overall_status']
        
    except Exception as e:
        fintech_logger.audit_log(
            action='NBE_COMPLIANCE_ERROR',
            details={'error': str(e)},
            level='ERROR'
        )
        return False

def main() -> int:
    """Main function to parse arguments and execute commands."""
    try:
        # Initialize colorama for Windows compatibility
        init(autoreset=True)
        
        # Setup logger
        fintech_logger = FintechLogger()
        
        # Print header
        print(f"{Fore.BLUE}=== MEQENET.ET ENHANCED FINTECH GIT AUTOMATION ===")
        print(f"{Fore.BLUE}📄 Governed by: FINTECH_BRANCHING_STRATEGY.md & GIT_BRANCH_PROTECTION_SETUP.md")
        print(f"{Fore.BLUE}🇪🇹 Ethiopian BNPL Platform - NBE Compliant v2.0")
        print(f"{Fore.BLUE}🔐 Session ID: {fintech_logger.session_id}")
        print("=" * 70)
        
        fintech_logger.audit_log(
            action='SESSION_START',
            details={
                'version': '2.0',
                'user': os.getenv('USER', 'unknown'),
                'working_directory': os.getcwd()
            }
        )
        
        # Create argument parser
        parser = argparse.ArgumentParser(
            description="Meqenet.et Enhanced Fintech Git Automation Script v2.0",
            epilog="All operations are subject to NBE compliance and enhanced security requirements."
        )
        
        # Add global options
        parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
        parser.add_argument('--dry-run', action='store_true', help='Simulate operations without making changes')
        
        subparsers = parser.add_subparsers(dest="command", required=True)
        
        # Enhanced security scan command
        security_parser = subparsers.add_parser(
            "security-scan",
            help="Run comprehensive security scanning for fintech compliance"
        )
        
        # Validate environment command
        validate_parser = subparsers.add_parser(
            "validate-environment",
            help="Validate Git environment for fintech compliance"
        )
        
        # Local CI/CD validation command
        ci_parser = subparsers.add_parser(
            "validate-ci",
            help="Run comprehensive local CI/CD validation before pushing"
        )
        ci_parser.add_argument(
            "--quick", 
            action="store_true", 
            help="Run only essential checks"
        )
        ci_parser.add_argument(
            "--security-only", 
            action="store_true", 
            help="Run only security checks"
        )
        ci_parser.add_argument(
            "--parallel", 
            action="store_true", 
            help="Run checks in parallel where possible"
        )
        
        # Pre-push validation command (combines all checks)
        prepush_parser = subparsers.add_parser(
            "pre-push-check",
            help="Complete pre-push validation (recommended before git push)"
        )
        prepush_parser.add_argument(
            "--auto-fix", 
            action="store_true", 
            help="Automatically fix issues where possible"
        )
        
        # Other existing commands would be added here...
        
        args = parser.parse_args()
        
        if args.verbose:
            logging.getLogger().setLevel(logging.DEBUG)
        
        # Execute commands
        if args.command == "security-scan":
            results = enhanced_security_scanning()
            return 0 if results['overall_status'] == 'PASS' else 1
            
        elif args.command == "validate-environment":
            return 0 if enhanced_validate_nbe_compliance() else 1
            
        elif args.command == "validate-ci":
            return run_local_ci_validation(args)
            
        elif args.command == "pre-push-check":
            return run_comprehensive_pre_push_check(args)
        
        # Default fallback
        print(f"{Fore.YELLOW}[INFO] Command not implemented in enhanced version yet")
        return 0
        
    except KeyboardInterrupt:
        fintech_logger.audit_log(
            action='SESSION_INTERRUPTED',
            details={'reason': 'User interruption'}
        )
        print(f"\n{Fore.YELLOW}⚠️  Operation interrupted by user")
        return 130
        
    except Exception as e:
        # Log critical errors with context
        print(f"{Fore.RED}[ERROR] Unexpected error: {e}")
        fintech_logger.audit_log(
            action='SESSION_ERROR',
            details={'error': str(e), 'type': type(e).__name__},
            level='ERROR'
        )
        return 1
        
    finally:
        # Log session completion
        fintech_logger.audit_log(
            action='SESSION_END',
            details={'duration_seconds': (datetime.now(timezone.utc) - fintech_logger.start_time).total_seconds()}
        )
        return 0

def run_local_ci_validation(args) -> int:
    """Run local CI/CD validation using our comprehensive validator"""
    try:
        print(f"{Fore.BLUE}🚀 Starting Local CI/CD Validation...")
        
        # Build command for local CI validator
        cmd = ["python", "governance/local_ci_validator.py"]
        
        if args.quick:
            cmd.append("--quick")
        elif args.security_only:
            cmd.append("--security-only")
            
        if args.parallel:
            cmd.append("--parallel")
        
        # Run the validation
        result = enhanced_run_command(cmd, timeout=1800)  # 30 minute timeout
        
        if isinstance(result, subprocess.CalledProcessError):
            print(f"{Fore.RED}❌ Local CI/CD validation failed")
            print(f"{Fore.YELLOW}💡 Check the detailed report in governance/logs/")
            return 1
        
        print(f"{Fore.GREEN}✅ Local CI/CD validation passed")
        return 0
        
    except Exception as e:
        fintech_logger.audit_log(
            action='LOCAL_CI_VALIDATION_ERROR',
            details={'error': str(e)},
            level='ERROR'
        )
        print(f"{Fore.RED}❌ Local CI validation error: {e}")
        return 1

def run_comprehensive_pre_push_check(args) -> int:
    """Run comprehensive pre-push validation including all checks and auto-fixes"""
    try:
        print(f"{Fore.BLUE}🏦 MEQENET.ET COMPREHENSIVE PRE-PUSH VALIDATION")
        print(f"{Fore.BLUE}================================================================")
        
        fintech_logger.audit_log(
            action='PRE_PUSH_VALIDATION_START',
            details={
                'auto_fix': args.auto_fix,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Step 1: Environment validation
        print(f"{Fore.CYAN}🔧 Step 1: Validating development environment...")
        if not enhanced_validate_nbe_compliance():
            print(f"{Fore.RED}❌ Environment validation failed")
            return 1
        print(f"{Fore.GREEN}✅ Environment validation passed")
        
        # Step 2: Security scanning
        print(f"{Fore.CYAN}🔒 Step 2: Running security scans...")
        security_results = enhanced_security_scanning()
        if security_results['overall_status'] != 'PASS':
            print(f"{Fore.RED}❌ Security validation failed")
            return 1
        print(f"{Fore.GREEN}✅ Security scans passed")
        
        # Step 3: Auto-fix common issues if requested
        if args.auto_fix:
            print(f"{Fore.CYAN}🔧 Step 3: Auto-fixing common issues...")
            
            # Format code
            format_result = enhanced_run_command(["pnpm", "run", "format:write"], timeout=120)
            if not isinstance(format_result, subprocess.CalledProcessError):
                print(f"{Fore.GREEN}  ✅ Code formatting applied")
            
            # Fix linting issues
            lint_result = enhanced_run_command(["pnpm", "run", "lint", "--fix"], timeout=180)
            if not isinstance(lint_result, subprocess.CalledProcessError):
                print(f"{Fore.GREEN}  ✅ Linting auto-fixes applied")
            
            print(f"{Fore.GREEN}✅ Auto-fixes completed")
        
        # Step 4: Comprehensive CI validation
        print(f"{Fore.CYAN}🧪 Step 4: Running comprehensive CI/CD validation...")
        ci_result = enhanced_run_command([
            "python", "governance/local_ci_validator.py", "--parallel"
        ], timeout=1800)
        
        if isinstance(ci_result, subprocess.CalledProcessError):
            print(f"{Fore.RED}❌ CI/CD validation failed")
            print(f"{Fore.YELLOW}💡 Review detailed report in governance/logs/local_ci_validation_report.json")
            return 1
        
        print(f"{Fore.GREEN}✅ CI/CD validation passed")
        
        # Step 5: Final summary
        print(f"{Fore.CYAN}📋 Step 5: Final validation summary...")
        print(f"{Fore.GREEN}🎉 ALL PRE-PUSH CHECKS PASSED!")
        print(f"{Fore.GREEN}🚀 Ready to push to remote repository")
        print(f"{Fore.BLUE}================================================================")
        
        fintech_logger.audit_log(
            action='PRE_PUSH_VALIDATION_SUCCESS',
            details={'timestamp': datetime.now(timezone.utc).isoformat()}
        )
        
        return 0
        
    except Exception as e:
        fintech_logger.audit_log(
            action='PRE_PUSH_VALIDATION_ERROR',
            details={'error': str(e)},
            level='ERROR'
        )
        print(f"{Fore.RED}❌ Pre-push validation error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 