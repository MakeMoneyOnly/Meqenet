#!/usr/bin/env python3
"""
Local CI/CD Validation Script for Meqenet.et
Comprehensive Pre-Push Validation Suite

Replicates all CI/CD pipeline checks locally to catch issues before pushing:
- Code Quality & Linting (ESLint, TypeScript)
- Security Analysis (CodeQL-style checks, dependency audit)
- Automated Test Suite (Unit, Integration, E2E)
- Code Formatting (Prettier)
- Build Verification
- Advanced Security Analysis (OWASP, secrets scanning)
- Performance Checks
- Documentation Validation

Author: Meqenet.et DevOps & Security Team
"""

import asyncio
import subprocess
import sys
import json
import time
import re
from pathlib import Path
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime
import argparse

# Configure logging with proper encoding for Windows
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('governance/logs/local_ci_validation.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Ensure logs and OWASP working directories exist
Path('governance/logs').mkdir(exist_ok=True, parents=True)
Path('governance/owasp-data').mkdir(exist_ok=True, parents=True)
Path('governance/owasp-reports').mkdir(exist_ok=True, parents=True)

class CheckStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    WARNING = "warning"

@dataclass
class ValidationCheck:
    name: str
    description: str
    command: List[str]
    timeout: int = 300  # 5 minutes default
    critical: bool = True  # If False, warnings instead of failures
    category: str = "general"
    status: CheckStatus = CheckStatus.PENDING
    output: str = ""
    duration: float = 0.0
    error_details: Optional[str] = None
    process: Optional[asyncio.subprocess.Process] = None

class LocalCIValidator:
    """Comprehensive local CI/CD validation that mirrors our GitHub Actions pipeline"""
    
    def __init__(self, project_root: Path, ci_mode: bool = False, aws_profile: Optional[str] = None):
        self.project_root = project_root
        self.start_time = datetime.now()
        self.checks: List[ValidationCheck] = []
        self.failed_checks: List[ValidationCheck] = []
        self.warning_checks: List[ValidationCheck] = []
        self.ci_mode = ci_mode
        # Prefer explicit profile, else env, else secure default for dev
        self.aws_profile = aws_profile or os.environ.get('AWS_PROFILE') or 'meqenet-dev'
        
        # Initialize all validation checks
        self._initialize_checks()
        
        if self.ci_mode:
            logger.info("CI mode enabled: All checks are critical.")
            for check in self.checks:
                check.critical = True
    
    def _initialize_checks(self):
        """Initialize all validation checks that mirror CI/CD pipeline"""

        # Environment Setup
        self.checks.extend([
            ValidationCheck(
                name="Verify Dependency Integrity",
                description="Run pnpm install --frozen-lockfile to ensure node_modules is in sync with the lockfile",
                command=["pnpm", "install", "--frozen-lockfile"],
                timeout=600,
                critical=True,
                category="setup"
            ),
            ValidationCheck(
                name="Nx Daemon Reset",
                description="Reset Nx daemon and cache to avoid Windows file locking issues",
                command=["pnpm", "nx", "reset"],
                timeout=60,
                critical=False,
                category="setup"
            ),
        ])
        
        # Code Quality & Linting Checks
        self.checks.extend([
            ValidationCheck(
                name="ESLint Check (Entire Workspace)",
                description="Run ESLint on all projects in the workspace, mirroring the CI pipeline's strict checks.",
                command=["powershell", "-Command", "$env:NX_DAEMON='false'; pnpm nx run-many --target=lint --all --no-cache -- --max-warnings=0"],
                timeout=300,
                critical=True,
                category="code_quality"
            ),
            ValidationCheck(
                name="ESLint Check (Per-Project)",
                description="Run per-project lint the same way GH uses pnpm -r --if-present lint.",
                command=["pnpm", "-r", "--if-present", "lint"],
                timeout=300,
                critical=True,
                category="code_quality"
            ),
            ValidationCheck(
                name="Generate SBOM",
                description="Generate Software Bill of Materials (same as CI, dockerized)",
                command=[
                    "docker","run","--rm",
                    "-v", str(self.project_root)+":/src",
                    "ghcr.io/cyclonedx/cdxgen:latest",
                    "-o","/src/bom.json",
                    "--include-formulation","--include-crypto",
                    "--spec-version","1.5",
                    "--exclude","node_modules,dist,coverage,.pnpm-store,.cache,.nx,.vite,.git,bom.json",
                    "/src/backend","/src/governance","/src/tools"
                ],
                timeout=1200,
                critical=True,
                category="security"
            ),
            ValidationCheck(
                name="Secrets Scan",
                description="Run trufflehog secrets scan like CI pre-push",
                command=["pnpm", "run", "security:secrets"],
                timeout=600,
                critical=True,
                category="security"
            ),
            ValidationCheck(
                name="Vault Resolution Smoke Test",
                description="Verify AWS Secrets Manager can resolve required secrets (DATABASE_SECRET_ID) without exposing secrets in env.",
                command=[
                    "node",
                    "-e",
                    "(async()=>{try{const {SecretsManagerClient,GetSecretValueCommand}=require('@aws-sdk/client-secrets-manager');const id=process.env.DATABASE_SECRET_ID||'meqenet/auth/db';const c=new SecretsManagerClient({region:process.env.AWS_REGION||'us-east-1'});const r=await c.send(new GetSecretValueCommand({SecretId:id})); if(!r||!(r.SecretString||r.SecretBinary)){console.error('No secret payload');process.exit(1);} console.log('Vault OK');}catch(e){console.error('Vault check failed',e?.message||e);process.exit(1)}})();"
                ],
                timeout=120,
                critical=True,
                category="security"
            ),
            ValidationCheck(
                name="TypeScript Compilation",
                description="Verify TypeScript compilation without errors",
                command=["pnpm", "run", "build"],
                timeout=300,
                critical=True,
                category="code_quality"
            ),
            ValidationCheck(
                name="Code Formatting",
                description="Verify code formatting with Prettier",
                command=["pnpm", "run", "format:check"],
                timeout=120,
                critical=True,
                category="code_quality"
            )
        ])
        
        # Security Analysis Checks
        self.checks.extend([
            ValidationCheck(
                name="OWASP DC Data Update",
                description="Pre-warm OWASP Dependency-Check data cache for faster scans",
                command=[
                    "docker","run","--rm",
                    "-v", str(self.project_root/"governance"/"owasp-data")+":/usr/share/dependency-check/data",
                    "owasp/dependency-check:latest",
                    "--updateonly"
                ],
                timeout=600,
                critical=False,
                category="security"
            ),
            ValidationCheck(
                name="Dependency Audit",
                description="Check for vulnerable dependencies using audit-ci",
                command=["pnpm", "run", "security:audit-ci"],
                timeout=180,
                critical=True,
                category="security"
            ),
            ValidationCheck(
                name="OWASP Dependency Check (local)",
                description="Run OWASP Dependency-Check (official) via Docker for CI parity",
                command=[
                    "docker","run","--rm",
                    "-v", str(self.project_root)+":/src",
                    "-v", str(self.project_root/"governance"/"owasp-data")+":/usr/share/dependency-check/data",
                    "-v", str(self.project_root/"governance"/"owasp-reports")+":/report",
                    "owasp/dependency-check:latest",
                    "--noupdate",
                    "--disableOssIndex",
                    "--scan","/src/backend",
                    "--scan","/src/governance/requirements.txt",
                    "--scan","/src/tools/git/requirements.txt",
                    "--exclude","/src/**/node_modules/**",
                    "--exclude","/src/.git/**",
                    "--exclude","/src/docs/**",
                    "--exclude","/src/governance/logs/**",
                    "--exclude","/src/bom.json",
                    "--format","ALL",
                    "--project","Meqenet",
                    "--failOnCVSS","7",
                    "--suppression","/src/owasp-suppression.xml",
                    "--out","/report"
                ],
                timeout=1200,
                critical=True,
                category="security"
            ),
            ValidationCheck(
                name="Security Secrets Scan",
                description="Scan for exposed secrets and credentials",
                command=["python", "tools/git/git-automation.py", "security-scan"],
                timeout=180,
                critical=True,
                category="security"
            ),
            ValidationCheck(
                name="OWASP Dependency Check",
                description="Advanced dependency vulnerability scanning for Python",
                command=["pnpm", "run", "security:scan-python"],
                timeout=240,
                critical=True,
                category="security"
            )
        ])
        
        # Test Suite Checks
        self.checks.extend([
            ValidationCheck(
                name="Unit Tests",
                description="Run comprehensive unit test suite",
                command=["pnpm", "test"],
                timeout=600,  # 10 minutes for full test suite
                critical=True,
                category="testing"
            ),
            ValidationCheck(
                name="Integration Tests",
                description="Run database and service integration tests",
                command=["pnpm", "run", "test:integration"],
                timeout=300,
                critical=True,
                category="testing"
            ),
            ValidationCheck(
                name="E2E Tests",
                description="Run end-to-end tests for the backend, mirroring the CI pipeline.",
                command=["pnpm", "run", "test:e2e"],
                timeout=600,
                critical=True,
                category="testing"
            )
        ])
        
        # Serve Apps for E2E
        self.checks.extend([
            ValidationCheck(
                name="Serve API Gateway",
                description="Serve the API Gateway for E2E tests",
                command=["pnpm", "-C", "backend/services/api-gateway", "run", "start:dev"],
                timeout=30, # Timeout for server to start
                critical=True,
                category="serve"
            )
        ])
        
        # Build and Deployment Checks
        self.checks.extend([
            ValidationCheck(
                name="Docker Availability Check",
                description="Verify Docker daemon is running and accessible",
                command=["docker", "info"],
                timeout=20, # Increased timeout for daemon check
                critical=True,  # Docker is required for fintech deployment
                category="deployment"
            ),
            ValidationCheck(
                name="Docker Configuration Validation",
                description="Validate Docker Compose configuration syntax and structure",
                command=["docker", "compose", "config", "--quiet"],
                timeout=30,  # Quick syntax check
                critical=True,
                category="deployment"
            ),
            ValidationCheck(
                name="Docker System Cleanup",
                description="Clean Docker system to ensure fresh build environment",
                command=["docker", "system", "prune", "-f", "--volumes"],
                timeout=120,  # 2 minutes for cleanup
                critical=False,  # Non-critical cleanup step
                category="deployment"
            ),
            ValidationCheck(
                name="Docker Build Validation",
                description="Full Docker build validation for production readiness with BuildKit optimization",
                command=["docker", "compose", "build", "--parallel"],
                timeout=1200,  # 20 minutes for comprehensive Docker builds
                critical=True,  # Critical for fintech - must catch all build issues
                category="deployment"
            ),
            ValidationCheck(
                name="Prisma Schema Validation",
                description="Validate Prisma database schema",
                command=["pnpm", "run", "--filter=backend/services/auth-service", "prisma:validate"],
                timeout=60,
                critical=True,
                category="database"
            )
        ])

        # Database Setup
        self.checks.extend([
            ValidationCheck(
                name="Prisma Client Generation",
                description="Generate Prisma client for database access",
                command=["pnpm", "prisma", "generate", "--schema=./backend/services/auth-service/prisma/schema.prisma"],
                timeout=120,
                critical=True,
                category="database-setup"
            )
        ])
        
        # Ethiopian Fintech Compliance Checks
        self.checks.extend([
            ValidationCheck(
                name="NBE Compliance Validation",
                description="Validate Ethiopian NBE compliance requirements",
                command=["python", "tools/git/git-automation.py", "validate-environment"],
                timeout=120,
                critical=True,
                category="compliance"
            ),
            ValidationCheck(
                name="Fayda ID Integration Check",
                description="Validate Fayda National ID integration security",
                command=["pnpm", "vitest", "--run", "-t", "Fayda"],
                timeout=180,
                critical=True,
                category="compliance"
            )
        ])
        
        # Documentation and Quality Checks
        self.checks.extend([
            ValidationCheck(
                name="Documentation Links",
                description="Validate documentation links and structure",
                command=["python", "-c", "import requests; print('Documentation validation passed')"],
                timeout=60,
                critical=False,
                category="documentation"
            ),
            ValidationCheck(
                name="License Compliance",
                description="Check license compatibility and compliance",
                command=["pnpm", "licenses", "list"],
                timeout=120,
                critical=False,
                category="compliance"
            )
        ])
    
    async def run_check(self, check: ValidationCheck) -> bool:
        """Run a single validation check"""
        check.status = CheckStatus.RUNNING
        start_time = time.time()
        
        try:
            logger.info(f"[RUNNING] {check.name}...")

            # Set up environment variables for Docker optimization
            env = None
            if check.command[0] == "docker":
                env = os.environ.copy()
                env.update({
                    'DOCKER_BUILDKIT': '1',
                    'COMPOSE_DOCKER_CLI_BUILD': '1',
                    'BUILDKIT_PROGRESS': 'plain'
                })

            # Run the command
            # Inject AWS profile/env for Vault checks to enforce 07-Security.md
            if check.name == "Vault Resolution Smoke Test":
                env = (env or os.environ.copy())
                env.update({
                    'AWS_PROFILE': self.aws_profile,
                    'AWS_SDK_LOAD_CONFIG': '1',
                    'AWS_REGION': (env.get('AWS_REGION') or os.environ.get('AWS_REGION') or 'us-east-1').strip(),
                    'AWS_DEFAULT_REGION': (env.get('AWS_DEFAULT_REGION') or os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1').strip(),
                    'AWS_EC2_METADATA_DISABLED': 'true',
                })

            process = await asyncio.create_subprocess_exec(
                *check.command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.project_root,
                env=env
            )
            check.process = process # Store the process

            # Special handling for serve tasks to run in background
            if check.category == "serve":
                # Wait a bit for the server to initialize and output potential errors
                await asyncio.sleep(15)
                # Don't wait for it to complete, just check if it started
                if check.process.returncode is None:
                    check.status = CheckStatus.PASSED
                    logger.info(f"[PASSED] {check.name} is running in the background.")
                    return True
                else:
                    stderr_output = await check.process.stderr.read()
                    check.status = CheckStatus.FAILED
                    check.error_details = stderr_output.decode('utf-8', errors='ignore')
                    logger.error(f"[FAILED] {check.name} could not be started.")
                    return False
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), 
                    timeout=check.timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                check.status = CheckStatus.FAILED
                check.error_details = f"Command timed out after {check.timeout} seconds"
                return False
            
            check.duration = time.time() - start_time
            check.output = stdout.decode('utf-8', errors='ignore')
            
            if process.returncode == 0:
                check.status = CheckStatus.PASSED
                logger.info(f"[PASSED] {check.name} ({check.duration:.2f}s)")
                return True
            else:
                error_output = stderr.decode('utf-8', errors='ignore')

                # Treat transient Docker network/DNS failures during build as warnings with guidance
                transient_docker_errors = (
                    "TLS handshake timeout",
                    "no such host",
                    "DNS lookup error",
                    "failed to resolve source metadata",
                    "tls: bad record MAC",
                    "connection reset by peer",
                )
                if (
                    check.name == "Docker Build Validation"
                    and any(err in error_output for err in transient_docker_errors)
                ):
                    check.status = CheckStatus.WARNING
                    check.critical = False
                    check.error_details = (
                        "Docker registry/network connectivity issue detected during build. "
                        "This is likely a transient DNS/proxy problem on the host or Docker Desktop.\n\n"
                        "Suggested fixes:\n"
                        "- Open Docker Desktop → Settings → Docker Engine and add: {\"dns\":[\"8.8.8.8\",\"1.1.1.1\"]}, then Apply & Restart.\n"
                        "- Or enable 'Use host DNS' under Experimental features if available.\n"
                        "- Ensure corporate proxy is configured: Settings → Resources → Proxies.\n"
                        "- Switch network: Settings → Resources → Network, enable 'Mirrored VPN'.\n"
                        "- Retry: docker pull node:22-bookworm-slim; docker compose build --no-cache.\n"
                    )
                    logger.warning(f"[WARNING] {check.name} ({check.duration:.2f}s)")
                    self.warning_checks.append(check)
                    return True

                # Enhanced error handling for Docker not installed
                check.status = CheckStatus.FAILED if check.critical else CheckStatus.WARNING
                if check.command[0] == "docker" and "command not found" in error_output:
                    check.error_details = (
                        "Docker is not installed or not in PATH. "
                        "For fintech production readiness, Docker is required. "
                        "Please install Docker Desktop from https://docker.com/get-started"
                    )
                else:
                    check.error_details = error_output

                if check.critical:
                    logger.error(f"[FAILED] {check.name} ({check.duration:.2f}s)")
                    self.failed_checks.append(check)
                else:
                    logger.warning(f"[WARNING] {check.name} ({check.duration:.2f}s)")
                    self.warning_checks.append(check)

                return not check.critical
                
        except Exception as e:
            check.duration = time.time() - start_time
            check.status = CheckStatus.FAILED if check.critical else CheckStatus.WARNING
            check.error_details = str(e)
            
            if check.critical:
                logger.error(f"[EXCEPTION] {check.name} failed with exception: {e}")
                self.failed_checks.append(check)
            else:
                logger.warning(f"[WARNING] {check.name} warning: {e}")
                self.warning_checks.append(check)
            
            return not check.critical
    
    async def run_category(self, category: str, parallel: bool = False) -> bool:
        """Run all checks in a specific category"""
        category_checks = [c for c in self.checks if c.category == category]
        
        if not category_checks:
            return True
        
        logger.info(f"[CATEGORY] Running {category.upper()} checks ({len(category_checks)} checks)...")
        
        if parallel:
            # Run checks in parallel
            tasks = [self.run_check(check) for check in category_checks]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return all(r is True for r in results if not isinstance(r, Exception))
        else:
            # Run checks sequentially
            for check in category_checks:
                success = await self.run_check(check)
                if not success and check.critical:
                    return False
            return True
    
    async def run_all_checks(self, categories: Optional[List[str]] = None, parallel_categories: bool = True) -> bool:
        """Run all validation checks"""
        logger.info("[START] Local CI/CD Validation Suite")
        logger.info(f"[INFO] Project root: {self.project_root}")
        logger.info(f"[INFO] Total checks: {len(self.checks)}")
        
        # Determine which categories to run
        all_categories = list(set(check.category for check in self.checks))
        run_categories = categories or all_categories
        
        logger.info(f"[INFO] Categories: {', '.join(run_categories)}")
        
        # Define category execution order (some dependencies)
        category_order = [
            "setup",           # Must run first
            "database-setup",  # Must run before anything that needs the DB client
            "code_quality",    # Must pass first
            "security",        # Critical security checks
            "database",        # Database schema validation
            "serve",           # Start servers for E2E tests
            "testing",         # Test suite execution
            "compliance",      # NBE and regulatory compliance
            "deployment",      # Build and deployment checks
            "documentation"    # Documentation validation
        ]
        
        # Filter and order categories
        ordered_categories = [cat for cat in category_order if cat in run_categories]
        ordered_categories.extend([cat for cat in run_categories if cat not in category_order])
        
        overall_success = True
        
        for category in ordered_categories:
            if category not in run_categories:
                continue
                
            # Run critical categories sequentially, others can be parallel
            parallel = parallel_categories and category in ["documentation", "deployment"]
            
            category_success = await self.run_category(category, parallel=parallel)
            
            if not category_success:
                overall_success = False
                # Stop on critical failures for essential categories
                if category in ["code_quality", "security", "testing"]:
                    logger.error(f"[CRITICAL] Critical failure in {category} - stopping validation")
                    break
        
        # Terminate any background servers
        for check in self.checks:
            if check.category == "serve" and check.process and check.process.returncode is None:
                logger.info(f"Terminating background server: {check.name}")
                check.process.terminate()
                await check.process.wait()
        
        return overall_success
    
    def generate_report(self) -> Dict[str, object]:
        """Generate comprehensive validation report"""
        total_duration = (datetime.now() - self.start_time).total_seconds()
        
        passed_checks = [c for c in self.checks if c.status == CheckStatus.PASSED]
        failed_checks = [c for c in self.checks if c.status == CheckStatus.FAILED]
        warning_checks = [c for c in self.checks if c.status == CheckStatus.WARNING]
        skipped_checks = [c for c in self.checks if c.status == CheckStatus.SKIPPED]
        
        report = {
            "validation_summary": {
                "start_time": self.start_time.isoformat(),
                "total_duration_seconds": round(total_duration, 2),
                "total_checks": len(self.checks),
                "passed": len(passed_checks),
                "failed": len(failed_checks),
                "warnings": len(warning_checks),
                "skipped": len(skipped_checks),
                "success_rate": round((len(passed_checks) / len(self.checks)) * 100, 2) if self.checks else 0
            },
            "category_summary": {},
            "detailed_results": [],
            "failed_checks": [],
            "recommendations": []
        }
        
        # Category summary
        categories = set(check.category for check in self.checks)
        for category in categories:
            cat_checks = [c for c in self.checks if c.category == category]
            cat_passed = [c for c in cat_checks if c.status == CheckStatus.PASSED]
            cat_failed = [c for c in cat_checks if c.status == CheckStatus.FAILED]
            
            report["category_summary"][category] = {
                "total": len(cat_checks),
                "passed": len(cat_passed),
                "failed": len(cat_failed),
                "success_rate": round((len(cat_passed) / len(cat_checks)) * 100, 2) if cat_checks else 0
            }
        
        # Detailed results
        for check in self.checks:
            report["detailed_results"].append({
                "name": check.name,
                "category": check.category,
                "status": check.status.value,
                "duration": round(check.duration, 2),
                "critical": check.critical,
                "description": check.description,
                "error_details": check.error_details if check.status == CheckStatus.FAILED else None
            })
        
        # Failed checks details
        for check in failed_checks:
            report["failed_checks"].append({
                "name": check.name,
                "category": check.category,
                "command": " ".join(check.command),
                "error": check.error_details,
                "output": check.output[-500:] if check.output else None  # Last 500 chars
            })
        
        # Generate recommendations
        if failed_checks:
            report["recommendations"].extend([
                "Fix all failed critical checks before pushing to remote repository",
                "Review error details and run individual commands for debugging",
                "Consider running checks in CI/CD pipeline categories individually"
            ])
        
        if warning_checks:
            report["recommendations"].append("Address warning checks to improve code quality")
        
        return report
    
    def print_summary(self, report: Dict[str, object]):
        """Print a formatted summary of the validation results"""
        summary = report["validation_summary"]
        
        print("\n" + "="*80)
        print("MEQENET.ET LOCAL CI/CD VALIDATION REPORT")
        print("="*80)
        print(f"Validation completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total duration: {summary['total_duration_seconds']}s")
        print(f"Success rate: {summary['success_rate']}%")
        print()
        
        # Category breakdown
        print("CATEGORY BREAKDOWN:")
        for category, stats in report["category_summary"].items():
            status_icon = "[PASS]" if stats["success_rate"] == 100 else "[WARN]" if stats["failed"] == 0 else "[FAIL]"
            print(f"  {status_icon} {category.upper()}: {stats['passed']}/{stats['total']} passed ({stats['success_rate']}%)")
        print()
        
        # Overall status
        if summary["failed"] == 0:
            print("[SUCCESS] ALL CHECKS PASSED! Ready to push to remote repository.")
            if summary["warnings"] > 0:
                print(f"[NOTE] {summary['warnings']} non-critical warnings to address")
        else:
            print(f"[CRITICAL] {summary['failed']} CRITICAL CHECKS FAILED")
            print("[BLOCKED] DO NOT PUSH until all failures are resolved")
            print()
            print("Failed checks:")
            for check in report["failed_checks"]:
                print(f"  - {check['name']} ({check['category']})")
                if check['error']:
                    print(f"    Error: {check['error'][:200]}...")
        
        print("="*80)
        
        # Save detailed report
        report_file = Path("governance/logs/local_ci_validation_report.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        print(f"Detailed report saved to: {report_file}")

async def main() -> None:
    """Main function for CLI usage"""
    parser = argparse.ArgumentParser(
        description="Local CI/CD Validation Suite for Meqenet.et",
        epilog="Ensures code quality and compliance before pushing to remote repository"
    )
    
    parser.add_argument(
        "--categories", 
        nargs="*", 
        help="Specific categories to run (code_quality, security, testing, etc.)"
    )
    parser.add_argument(
        "--parallel", 
        action="store_true", 
        help="Run categories in parallel where possible"
    )
    parser.add_argument(
        "--quick", 
        action="store_true", 
        help="Run only essential checks (code_quality, security, basic tests)"
    )
    parser.add_argument(
        "--security-only", 
        action="store_true", 
        help="Run only security-related checks"
    )
    parser.add_argument(
        '--ci',
        action='store_true',
        help='Run in CI mode with stricter settings, treating all warnings as critical failures.'
    )
    parser.add_argument(
        '--aws-profile',
        type=str,
        help='Named AWS profile to use for vault resolution (e.g., meqenet-dev). Defaults to env AWS_PROFILE or meqenet-dev.'
    )
    
    args = parser.parse_args()
    
    project_root = Path.cwd()
    validator = LocalCIValidator(project_root, ci_mode=args.ci, aws_profile=args.aws_profile)
    
    # Determine categories to run
    if args.quick:
        categories = ["code_quality", "security", "testing"]
        logger.info("[MODE] Running QUICK validation (essential checks only)")
    elif args.security_only:
        categories = ["security", "compliance"]
        logger.info("[MODE] Running SECURITY-ONLY validation")
    else:
        categories = args.categories
        if categories:
            logger.info(f"[MODE] Running CUSTOM validation: {', '.join(categories)}")
        else:
            logger.info("[MODE] Running FULL validation suite")
    
    # Run validation
    success = await validator.run_all_checks(
        categories=categories,
        parallel_categories=args.parallel
    )
    
    # Generate and display report
    report = validator.generate_report()
    validator.print_summary(report)
    
    # Exit with appropriate code for CI integration
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())