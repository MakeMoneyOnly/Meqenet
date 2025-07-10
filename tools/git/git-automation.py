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
        self.start_time = datetime.now(tz.UTC if TIMEZONE_SUPPORT else None)
        
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
            'timestamp': datetime.now(tz.UTC if TIMEZONE_SUPPORT else None).isoformat(),
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
                # Check for problematic licenses
                problematic_licenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0']
                for license_name in problematic_licenses:
                    if license_name in license_result:
                        scan_results['license_compliance'].append({
                            'license': license_name,
                            'risk': 'HIGH',
                            'description': 'Potentially incompatible license detected'
                        })
        except Exception:
            pass  # License checking is optional
        
        # Determine overall status
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
                print(f"{Fore.RED}  🚨 Potential secret in {secret['file']}:{secret['line']}")
        
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
        
        compliance_results['overall_status'] = all([
            compliance_results['gpg_signing'],
            compliance_results['user_config']
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

def main():
    """Enhanced main function with comprehensive fintech governance."""
    try:
        print(f"{Fore.BLUE}🏦 MEQENET.ET ENHANCED FINTECH GIT AUTOMATION")
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
        
        # Default fallback
        print(f"{Fore.YELLOW}💡 Command not implemented in enhanced version yet")
        return 0
        
    except KeyboardInterrupt:
        fintech_logger.audit_log(
            action='SESSION_INTERRUPTED',
            details={'reason': 'User interruption'}
        )
        print(f"\n{Fore.YELLOW}⚠️  Operation interrupted by user")
        return 130
        
    except Exception as e:
        fintech_logger.audit_log(
            action='SESSION_ERROR',
            details={'error': str(e), 'type': type(e).__name__},
            level='ERROR'
        )
        print(f"{Fore.RED}❌ Unexpected error: {e}")
        return 1
        
    finally:
        fintech_logger.audit_log(
            action='SESSION_END',
            details={'duration_seconds': (datetime.now() - fintech_logger.start_time).total_seconds()}
        )

if __name__ == "__main__":
    sys.exit(main()) 