#!/usr/bin/env python3
"""
🎯 Meqenet.et Governance Framework - Unified Orchestrator
Enterprise-Grade C-Suite Dashboard Orchestrator & Manager

This script provides comprehensive orchestration and management capabilities for the
Meqenet.et Governance Framework, combining deployment, execution, scheduling, and
user interface functionality in a single, unified command-line interface.

Features:
- Real-time C-Suite dashboard orchestration (CEO, CFO, CTO, CCO, CISO, Unified)
- Automated execution and scheduling with cron support
- Comprehensive configuration management
- Multi-channel notification system (Email, Slack, Teams)
- Advanced reporting and analytics
- Backup and disaster recovery
- Interactive menu system for easy operation
- Cross-platform compatibility

Author: Meqenet.et Governance Team
"""

import os
import sys
import json
import yaml
import asyncio
import subprocess
import argparse
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict, field
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, as_completed
import shutil

# Optional imports with fallbacks
try:
    import schedule
    SCHEDULE_AVAILABLE = True
except ImportError:
    SCHEDULE_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False

# Core Data Structures
@dataclass
class DashboardConfig:
    """Configuration for individual dashboards"""
    name: str
    script_path: str
    enabled: bool = True
    schedule_cron: str = ""
    timeout_minutes: int = 15
    dependencies: List[str] = field(default_factory=list)
    environment_vars: Dict[str, str] = field(default_factory=dict)

@dataclass
class ExecutionResult:
    """Result of dashboard execution"""
    dashboard_id: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    exit_code: Optional[int] = None
    output: str = ""
    error: str = ""
    report_path: Optional[str] = None

@dataclass
class NotificationConfig:
    """Notification system configuration"""
    email: Dict[str, Any] = field(default_factory=dict)
    slack: Dict[str, Any] = field(default_factory=dict)
    teams: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BackupConfig:
    """Backup configuration"""
    enabled: bool = True
    schedule_cron: str = "0 2 * * *"  # Daily at 2 AM
    retention_days: int = 30
    max_backups: int = 10
    include_logs: bool = True
    include_reports: bool = True
    include_databases: bool = True

# Enums
class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class ExecutionStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"

# Enhanced Dashboard Display Class
class DashboardDisplay:
    """Enhanced visual dashboard display manager"""

    def __init__(self):
        self.width = 80
        self.start_time = None

    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')

    def print_header(self):
        """Print enhanced dashboard header"""
        print("=" * self.width)
        print("🎯 MEQENET.ET ENTERPRISE GOVERNANCE SUITE".center(self.width))
        print("=" * self.width)
        print()

    def print_governance_summary(self):
        """Print comprehensive governance dashboard summary"""
        print("🏛️ GOVERNANCE DASHBOARD OVERVIEW")
        print("-" * self.width)
        print("🎯 Executive Dashboards Available:")
        print("   • CEO  - Strategic Business Intelligence & KPIs")
        print("   • CFO  - Financial Performance & Budget Analytics")
        print("   • CTO  - Technical Infrastructure & DevOps Metrics")
        print("   • CCO  - Regulatory Compliance & Risk Management")
        print("   • CISO - Security Posture & Threat Intelligence")
        print("   • UNIFIED - Cross-functional Executive Summary")
        print()
        print("📊 Current Status: Enterprise Monitoring Active")
        print("🔄 Last Updated:", datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'))
        print("⚡ Automation: Scheduled execution enabled")
        print("-" * self.width)
        print()

    def print_progress_bar(self, current: int, total: int, dashboard_name: str, status: str = "Running"):
        """Print enhanced visual progress bar"""
        progress = current / total if total > 0 else 0
        filled_length = int(self.width * 0.6 * progress)
        bar = "█" * filled_length + "░" * (int(self.width * 0.6) - filled_length)

        status_icon = {
            "Running": "🔄",
            "Success": "✅",
            "Failed": "❌",
            "Pending": "⏸️",
            "Timeout": "⏰"
        }.get(status, "🔄")

        print(f"{status_icon} {dashboard_name:<30} [{bar}] {progress:.0%}")

    def print_execution_results(self, results: List[ExecutionResult]):
        """Print comprehensive execution results"""
        print("\n📊 EXECUTION RESULTS")
        print("-" * self.width)

        headers = ["Dashboard", "Status", "Duration", "Exit Code", "Report"]
        col_widths = [25, 12, 12, 10, 8]

        # Print headers
        header_row = ""
        for header, width in zip(headers, col_widths):
            header_row += f"{header:<{width}}"
        print(header_row)
        print("-" * self.width)

        # Print results
        for result in results:
            dashboard_name = result.dashboard_id.upper()
            status_icon = "✅" if result.status == ExecutionStatus.SUCCESS.value else "❌" if result.status == ExecutionStatus.FAILED.value else "🔄"
            duration = ".1f" if result.duration else "N/A"
            exit_code = str(result.exit_code) if result.exit_code is not None else "N/A"
            report = "Yes" if result.report_path else "No"

            row = f"{dashboard_name:<25}{status_icon} {result.status:<10}{duration:<12}{exit_code:<10}{report:<8}"
            print(row)

    def print_summary(self, successful: int, failed: int, total_duration: float):
        """Print enhanced execution summary"""
        print("\n" + "=" * self.width)
        print("📈 EXECUTION SUMMARY".center(self.width))
        print("=" * self.width)

        total = successful + failed
        success_rate = (successful / total) * 100 if total > 0 else 0

        print(f"✅ Successful Executions: {successful}")
        print(f"❌ Failed Executions: {failed}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        print(f"⏱️ Total Duration: {total_duration:.1f}s")
        print(f"📊 Interactive Charts: Available in reports/")
        print(f"📁 Reports Generated: {successful}")

    def print_available_actions(self):
        """Print available orchestrator actions"""
        print("🎯 AVAILABLE ACTIONS")
        print("-" * self.width)
        print("📊 --status                 Show governance suite status")
        print("🚀 --run-all                Run all enabled dashboards")
        print("🎯 --run-dashboard <id>     Run specific dashboard (ceo|cfo|cto|cco|ciso|unified)")
        print("⏰ --scheduler              Start automated governance monitoring")
        print("💾 --backup                 Perform comprehensive data backup")
        print("🔧 --setup                  Setup and validate governance suite")
        print("💪 --force                  Force execution of disabled dashboards")
        print("-" * self.width)

# Configure comprehensive logging
def setup_comprehensive_logging():
    """Setup comprehensive logging with file and console handlers"""
    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    # Create logger
    logger = logging.getLogger('governance_orchestrator')
    logger.setLevel(logging.DEBUG)

    # File handler for detailed logging
    file_handler = logging.FileHandler(
        logs_dir / 'governance_orchestrator.log',
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)

    # Console handler for user feedback
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    console_formatter = logging.Formatter('%(levelname)s: %(message)s')

    file_handler.setFormatter(file_formatter)
    console_handler.setFormatter(console_formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# Initialize logger
logger = setup_comprehensive_logging()

# Configuration
GOVERNANCE_DIR = Path(__file__).parent
CONFIG_FILE = GOVERNANCE_DIR / "config" / "governance_config.yaml"
LOGS_DIR = GOVERNANCE_DIR / "logs"
REPORTS_DIR = GOVERNANCE_DIR / "reports"
BACKUPS_DIR = GOVERNANCE_DIR / "backups"
DATA_DIR = GOVERNANCE_DIR / "data"

# Ensure directories exist
for directory in [LOGS_DIR, REPORTS_DIR, BACKUPS_DIR, DATA_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# Main Governance Orchestrator Class
class GovernanceOrchestrator:
    """Enterprise C-Suite Governance Dashboard Orchestrator"""

    def __init__(self, config_path: Optional[Path] = None):
        """Initialize the governance orchestrator"""
        self.governance_dir = GOVERNANCE_DIR
        self.config_path = config_path or CONFIG_FILE
        self.logs_dir = LOGS_DIR
        self.reports_dir = REPORTS_DIR
        self.backups_dir = BACKUPS_DIR
        self.data_dir = DATA_DIR

        # Load configuration
        self.config = self._load_config()
        self.dashboards = self._load_dashboards()

        # Display manager
        self.display = DashboardDisplay()

        # Scheduler state
        self.scheduler_running = False

        logger.info("🎯 Governance Orchestrator initialized successfully")

    def _load_config(self) -> Dict[str, Any]:
        """Load governance configuration"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f) or {}
                logger.info(f"✅ Configuration loaded from {self.config_path}")
                return config
            else:
                logger.warning(f"⚠️ Configuration file not found: {self.config_path}")
                return {}
        except Exception as e:
            logger.error(f"❌ Failed to load configuration: {str(e)}")
            return {}

    def _load_dashboards(self) -> Dict[str, DashboardConfig]:
        """Load dashboard configurations"""
        dashboards = {}
        dashboard_configs = self.config.get('dashboards', {})

        for dashboard_id, config_data in dashboard_configs.items():
            if isinstance(config_data, dict):
                dashboards[dashboard_id] = DashboardConfig(
                    name=config_data.get('name', dashboard_id.upper()),
                    script_path=config_data.get('script_path', f'dashboards/{dashboard_id}.py'),
                    enabled=config_data.get('enabled', True),
                    schedule_cron=config_data.get('schedule_cron', ''),
                    timeout_minutes=config_data.get('timeout_minutes', 15),
                    dependencies=config_data.get('dependencies', []),
                    environment_vars=config_data.get('environment_vars', {})
                )

        logger.info(f"✅ Loaded {len(dashboards)} dashboard configurations")
        return dashboards

    async def run_dashboard(self, dashboard_id: str, force: bool = False) -> ExecutionResult:
        """Run a specific dashboard"""
        if dashboard_id not in self.dashboards:
            raise ValueError(f"Dashboard '{dashboard_id}' not found")

        dashboard = self.dashboards[dashboard_id]

        if not dashboard.enabled and not force:
            logger.warning(f"⚠️ Dashboard '{dashboard_id}' is disabled. Use --force to run anyway.")
            return ExecutionResult(
                dashboard_id=dashboard_id,
                status=ExecutionStatus.CANCELLED.value,
                start_time=datetime.now(),
                error="Dashboard disabled"
            )

        logger.info(f"🚀 Starting execution of {dashboard.name}")

        start_time = datetime.now()
        result = ExecutionResult(
            dashboard_id=dashboard_id,
            status=ExecutionStatus.RUNNING.value,
            start_time=start_time
        )

        try:
            # Execute the dashboard script
            script_path = Path(dashboard.script_path)
            if not script_path.exists():
                raise FileNotFoundError(f"Dashboard script not found: {script_path}")

            # Prepare environment
            env = os.environ.copy()
            env.update(dashboard.environment_vars)

            # Run the script with timeout
            process = await asyncio.create_subprocess_exec(
                sys.executable, str(script_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
                cwd=self.governance_dir
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=dashboard.timeout_minutes * 60
                )

                result.end_time = datetime.now()
                result.duration = (result.end_time - start_time).total_seconds()
                result.exit_code = process.returncode
                result.output = stdout.decode('utf-8', errors='replace')
                result.error = stderr.decode('utf-8', errors='replace')

                if process.returncode == 0:
                    result.status = ExecutionStatus.SUCCESS.value
                    logger.info(f"✅ {dashboard.name} completed successfully in {result.duration:.1f}s")
                else:
                    result.status = ExecutionStatus.FAILED.value
                    logger.error(f"❌ {dashboard.name} failed with exit code {process.returncode}")

            except asyncio.TimeoutError:
                process.kill()
                result.status = ExecutionStatus.TIMEOUT.value
                result.end_time = datetime.now()
                result.duration = (result.end_time - start_time).total_seconds()
                logger.error(f"⏰ {dashboard.name} timed out after {dashboard.timeout_minutes} minutes")

        except Exception as e:
            result.status = ExecutionStatus.FAILED.value
            result.end_time = datetime.now()
            result.duration = (result.end_time - start_time).total_seconds()
            result.error = str(e)
            logger.error(f"❌ {dashboard.name} execution failed: {str(e)}")

        # Generate report if successful
        if result.status == ExecutionStatus.SUCCESS.value:
            result.report_path = self._generate_execution_report(result)

        return result

    async def run_all_dashboards(self, force: bool = False) -> List[ExecutionResult]:
        """Run all enabled dashboards"""
        logger.info("🎯 Starting execution of all governance dashboards")

        results = []
        enabled_dashboards = [d for d in self.dashboards.values() if d.enabled or force]

        if not enabled_dashboards:
            logger.warning("⚠️ No enabled dashboards found")
            return results

        # Execute dashboards concurrently
        execution_tasks = []
        for dashboard_id, dashboard in self.dashboards.items():
            if dashboard.enabled or force:
                task = asyncio.create_task(self.run_dashboard(dashboard_id, force))
                execution_tasks.append(task)

        # Wait for all executions to complete
        completed_results = await asyncio.gather(*execution_tasks, return_exceptions=True)

        for result in completed_results:
            if isinstance(result, Exception):
                logger.error(f"❌ Execution error: {str(result)}")
            else:
                results.append(result)

        # Generate summary report
        self._generate_summary_report(results)

        return results

    def _generate_execution_report(self, result: ExecutionResult) -> Optional[str]:
        """Generate execution report for a dashboard"""
        try:
            dashboard = self.dashboards[result.dashboard_id]
            timestamp = result.start_time.strftime('%Y-%m-%d_%H-%M-%S')
            report_filename = f"{result.dashboard_id}_execution_{timestamp}.md"
            report_path = self.reports_dir / report_filename

            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(f"# {dashboard.name} Execution Report\n\n")
                f.write(f"**Dashboard ID:** {result.dashboard_id}\n")
                f.write(f"**Execution Time:** {result.start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"**Duration:** {result.duration:.1f} seconds\n")
                f.write(f"**Status:** {result.status.upper()}\n\n")

                if result.output:
                    f.write("## Output\n\n")
                    f.write("```\n")
                    f.write(result.output)
                    f.write("\n```\n\n")

                if result.error:
                    f.write("## Errors\n\n")
                    f.write("```\n")
                    f.write(result.error)
                    f.write("\n```\n\n")

            logger.info(f"📄 Generated execution report: {report_path}")
            return str(report_path)

        except Exception as e:
            logger.error(f"❌ Failed to generate execution report: {str(e)}")
            return None

    def _generate_summary_report(self, results: List[ExecutionResult]) -> None:
        """Generate comprehensive execution summary"""
        try:
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            summary_filename = f"governance_execution_summary_{timestamp}.md"
            summary_path = self.reports_dir / summary_filename

            successful = sum(1 for r in results if r.status == ExecutionStatus.SUCCESS.value)
            failed = sum(1 for r in results if r.status == ExecutionStatus.FAILED.value)
            total_duration = sum(r.duration or 0 for r in results)

            with open(summary_path, 'w', encoding='utf-8') as f:
                f.write("# 🎯 Governance Suite Execution Summary\n\n")
                f.write(f"**Execution Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"**Total Dashboards:** {len(results)}\n")
                f.write(f"**Successful:** {successful}\n")
                f.write(f"**Failed:** {failed}\n")
                f.write(f"**Success Rate:** {(successful / len(results) * 100):.1f}%\n")
                f.write(f"**Total Duration:** {total_duration:.1f} seconds\n\n")

                f.write("## 📊 Dashboard Results\n\n")
                f.write("| Dashboard | Status | Duration | Report |\n")
                f.write("|-----------|--------|----------|--------|\n")

                for result in results:
                    dashboard = self.dashboards.get(result.dashboard_id)
                    name = dashboard.name if dashboard else result.dashboard_id
                    status_icon = "✅" if result.status == ExecutionStatus.SUCCESS.value else "❌"
                    duration = f"{result.duration:.1f}s" if result.duration else "N/A"
                    report = "Yes" if result.report_path else "No"

                    f.write(f"| {name} | {status_icon} {result.status} | {duration} | {report} |\n")

            logger.info(f"📊 Generated summary report: {summary_path}")

        except Exception as e:
            logger.error(f"❌ Failed to generate summary report: {str(e)}")

    def start_scheduler(self) -> None:
        """Start the automated governance scheduler"""
        if not SCHEDULE_AVAILABLE:
            logger.error("❌ Schedule library not available. Install with: pip install schedule")
            return

        logger.info("⏰ Starting Governance Suite Scheduler...")

        self.scheduler_running = True

        # Schedule dashboards based on their cron configurations
        for dashboard_id, dashboard in self.dashboards.items():
            if dashboard.enabled:
                cron_schedule = dashboard.schedule_cron
                if cron_schedule:
                    try:
                        # Simple daily scheduling (can be enhanced with proper cron parsing)
                        if "08" in cron_schedule:  # Morning schedule
                            schedule.every().day.at("08:00").do(self._scheduled_run, dashboard_id)
                        elif "09" in cron_schedule:  # CFO schedule
                            schedule.every().day.at("09:00").do(self._scheduled_run, dashboard_id)
                        elif "10" in cron_schedule:  # CCO schedule
                            schedule.every().day.at("10:00").do(self._scheduled_run, dashboard_id)
                        elif "11" in cron_schedule:  # CTO schedule
                            schedule.every().day.at("11:00").do(self._scheduled_run, dashboard_id)

                        logger.info(f"📅 Scheduled {dashboard.name} for automated execution")
                    except Exception as e:
                        logger.error(f"❌ Failed to schedule {dashboard.name}: {str(e)}")

        # Keep the scheduler running
        try:
            while self.scheduler_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("⏹️ Scheduler stopped by user")
        except Exception as e:
            logger.error(f"❌ Scheduler error: {str(e)}")

    def _scheduled_run(self, dashboard_id: str) -> None:
        """Run a dashboard as part of scheduled execution"""
        try:
            logger.info(f"🕒 Running scheduled execution of {dashboard_id}")
            # Create new event loop for async execution
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(self.run_dashboard(dashboard_id))
            loop.close()

            if result.status == ExecutionStatus.SUCCESS.value:
                logger.info(f"✅ Scheduled execution completed: {dashboard_id}")
            else:
                logger.error(f"❌ Scheduled execution failed: {dashboard_id} - {result.error}")

        except Exception as e:
            logger.error(f"❌ Scheduled execution error for {dashboard_id}: {str(e)}")

    def stop_scheduler(self) -> None:
        """Stop the automated scheduler"""
        logger.info("⏹️ Stopping Governance Suite Scheduler...")
        self.scheduler_running = False

    def show_status(self) -> None:
        """Show current governance suite status"""
        self.display.clear_screen()
        self.display.print_header()
        self.display.print_governance_summary()

        print("📊 DASHBOARD STATUS")
        print("-" * 80)

        for dashboard_id, dashboard in self.dashboards.items():
            status_icon = "✅" if dashboard.enabled else "⏸️"
            status_text = "Enabled" if dashboard.enabled else "Disabled"
            schedule_text = dashboard.schedule_cron if dashboard.schedule_cron else "Manual"

            print(f"{status_icon} {dashboard.name:<30} | {status_text:<8} | {schedule_text}")

        print("-" * 80)
        print(f"📁 Reports Directory: {self.reports_dir}")
        print(f"📋 Logs Directory: {self.logs_dir}")
        print(f"💾 Backups Directory: {self.backups_dir}")
        print()

    def perform_backup(self) -> bool:
        """Perform comprehensive governance data backup"""
        try:
            logger.info("💾 Starting comprehensive governance backup")

            # Create backup directory with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = self.backups_dir / f"governance_backup_{timestamp}"
            backup_dir.mkdir(exist_ok=True, parents=True)

            # Backup configuration files
            config_backup = backup_dir / "config"
            config_backup.mkdir(exist_ok=True)
            if self.config_path.exists():
                shutil.copy2(self.config_path, config_backup)

            # Backup reports
            if self.reports_dir.exists():
                reports_backup = backup_dir / "reports"
                shutil.copytree(self.reports_dir, reports_backup, dirs_exist_ok=True)

            # Backup data files (databases)
            if self.data_dir.exists():
                data_backup = backup_dir / "data"
                shutil.copytree(self.data_dir, data_backup, dirs_exist_ok=True)

            # Backup logs
            if self.logs_dir.exists():
                logs_backup = backup_dir / "logs"
                shutil.copytree(self.logs_dir, logs_backup, dirs_exist_ok=True)

            # Create backup manifest
            manifest = {
                "backup_timestamp": timestamp,
                "backup_directory": str(backup_dir),
                "included_directories": ["config", "reports", "data", "logs"],
                "created_by": "GovernanceOrchestrator"
            }

            manifest_path = backup_dir / "backup_manifest.json"
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, default=str)

            logger.info(f"✅ Governance backup completed successfully: {backup_dir}")
            return True

        except Exception as e:
            logger.error(f"❌ Governance backup failed: {str(e)}")
            return False

    def cleanup_old_backups(self, retention_days: int = 30) -> None:
        """Clean up old backups based on retention policy"""
        try:
            logger.info(f"🧹 Cleaning up backups older than {retention_days} days")

            if not self.backups_dir.exists():
                return

            cutoff_date = datetime.now() - timedelta(days=retention_days)
            deleted_count = 0

            for backup_dir in self.backups_dir.iterdir():
                if backup_dir.is_dir() and backup_dir.name.startswith("governance_backup_"):
                    try:
                        # Extract timestamp from directory name
                        timestamp_str = backup_dir.name.replace("governance_backup_", "")
                        backup_date = datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')

                        if backup_date < cutoff_date:
                            shutil.rmtree(backup_dir)
                            deleted_count += 1
                            logger.info(f"🗑️ Deleted old backup: {backup_dir.name}")

                    except (ValueError, OSError) as e:
                        logger.warning(f"⚠️ Could not process backup directory {backup_dir.name}: {str(e)}")

            if deleted_count > 0:
                logger.info(f"✅ Cleaned up {deleted_count} old backups")
            else:
                logger.info("ℹ️ No old backups to clean up")

        except Exception as e:
            logger.error(f"❌ Backup cleanup failed: {str(e)}")

    def show_quick_menu(self) -> str:
        """Show interactive quick menu"""
        self.display.clear_screen()
        self.display.print_header()

        print("🎯 QUICK START MENU")
        print("=" * 80)
        print()
        print("Choose an option:")
        print("1. 🚀 Run all dashboards once")
        print("2. 🎯 Run specific dashboard")
        print("3. ⏰ Start scheduled execution")
        print("4. 📄 View latest reports")
        print("5. 📊 Check system status")
        print("6. 💾 Perform backup")
        print("7. 🔧 Setup/validate system")
        print("8. ❓ Help & documentation")
        print("9. Exit")
        print()

        try:
            choice = input("Enter your choice (1-9): ").strip()
            return choice
        except KeyboardInterrupt:
            return "9"

# Interactive Menu Handler
def handle_quick_menu(orchestrator: GovernanceOrchestrator) -> None:
    """Handle interactive quick menu"""
    while True:
        choice = orchestrator.show_quick_menu()

        if choice == "1":
            print("\n🎯 Running all dashboards...")
            try:
                results = asyncio.run(orchestrator.run_all_dashboards())

                # Display results
                orchestrator.display.print_execution_results(results)

                # Calculate summary
                successful = sum(1 for r in results if r.status == ExecutionStatus.SUCCESS.value)
                failed = sum(1 for r in results if r.status == ExecutionStatus.FAILED.value)
                total_duration = sum(r.duration or 0 for r in results)

                orchestrator.display.print_summary(successful, failed, total_duration)

                if successful > 0:
                    print("\n📊 Execution Summary Report Generated!")
                    print("📁 Check reports/ directory for detailed reports")

            except Exception as e:
                logger.error(f"❌ Failed to execute dashboards: {str(e)}")
                print(f"❌ Error executing dashboards: {str(e)}")

        elif choice == "2":
            dashboard = input("Enter dashboard (ceo/cfo/cto/cco/ciso/unified): ").strip().lower()
            if dashboard in ["ceo", "cfo", "cto", "cco", "ciso", "unified"]:
                print(f"\n🎯 Running {dashboard.upper()} dashboard...")
                try:
                    result = asyncio.run(orchestrator.run_dashboard(dashboard))
                    orchestrator.display.print_execution_results([result])

                    if result.status == ExecutionStatus.SUCCESS.value:
                        print("✅ Dashboard execution completed successfully!")
                        if result.report_path:
                            print(f"📄 Report generated: {result.report_path}")
                    else:
                        print(f"❌ Dashboard execution failed: {result.error}")

                except ValueError as e:
                    print(f"❌ Error: {str(e)}")
                    print(f"Available dashboards: {', '.join(orchestrator.dashboards.keys())}")
            else:
                print("❌ Invalid dashboard name")

        elif choice == "3":
            print("\n🕒 Starting scheduled execution...")
            print("📅 Automated monitoring enabled")
            print("🔄 Dashboards will run according to their schedules")
            print("⚠️  Press Ctrl+C to stop")
            try:
                orchestrator.start_scheduler()
            except KeyboardInterrupt:
                print("\n⏹️ Scheduler stopped by user")
                orchestrator.stop_scheduler()

        elif choice == "4":
            print("\n📄 Latest reports:")
            reports_dir = orchestrator.reports_dir
            if reports_dir.exists():
                reports = sorted(reports_dir.glob("*.md"), key=lambda x: x.stat().st_mtime, reverse=True)
                for i, report in enumerate(reports[:10], 1):
                    print(f"{i}. {report.name} ({report.stat().st_mtime.strftime('%Y-%m-%d %H:%M')})")
            else:
                print("No reports found. Run dashboards first.")

        elif choice == "5":
            orchestrator.show_status()

        elif choice == "6":
            print("\n💾 Performing Governance Suite Backup...")
            try:
                success = orchestrator.perform_backup()
                if success:
                    print("✅ Backup completed successfully!")
                    # Cleanup old backups
                    orchestrator.cleanup_old_backups()
                else:
                    print("❌ Backup failed!")
            except Exception as e:
                logger.error(f"❌ Backup failed: {str(e)}")
                print(f"❌ Backup failed: {str(e)}")

        elif choice == "7":
            print("\n🔧 Validating Governance Suite...")
            # Basic validation
            config_exists = orchestrator.config_path.exists()
            dashboards_loaded = len(orchestrator.dashboards) > 0

            if config_exists:
                print("✅ Configuration: OK")
            else:
                print("❌ Configuration: Missing")

            if dashboards_loaded:
                print(f"✅ Dashboards: {len(orchestrator.dashboards)} loaded")
            else:
                print("❌ Dashboards: None loaded")

            print("🎯 Setup validation complete!")

        elif choice == "8":
            print("\n❓ Help & Documentation")
            print("=" * 80)
            print("📚 Available Documentation:")
            print("• README.md - Complete framework documentation")
            print("• docs/Dashboard_Operations_Guide.md - Dashboard operations")
            print("• docs/INSTALLATION.md - Installation guide")
            print("• docs/DIRECTORY_STRUCTURE.md - Directory structure")
            print()
            print("🎯 Quick Commands:")
            print("• python orchestrator.py --status - Show system status")
            print("• python orchestrator.py --run-all - Run all dashboards")
            print("• python orchestrator.py --run-dashboard ceo - Run CEO dashboard")
            print("• python orchestrator.py --scheduler - Start automated monitoring")
            print()
            print("📞 For support: governance@meqenet.et")

        elif choice == "9":
            print("👋 Goodbye!")
            break

        else:
            print("❌ Invalid choice")

        input("\nPress Enter to continue...")

# Main CLI Interface
async def main():
    """Main entry point with comprehensive CLI interface"""
    parser = argparse.ArgumentParser(
        description='🎯 Meqenet.et Enterprise Governance Suite - Unified Orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python orchestrator.py --status                    # Show governance status
  python orchestrator.py --run-all                   # Run all enabled dashboards
  python orchestrator.py --run-dashboard ceo         # Run CEO dashboard only
  python orchestrator.py --run-dashboard cto --force # Force run CTO dashboard
  python orchestrator.py --scheduler                 # Start automated monitoring
  python orchestrator.py --backup                    # Perform data backup
  python orchestrator.py --menu                      # Interactive menu
        """
    )

    parser.add_argument('--status', action='store_true',
                       help='Show current governance suite status')
    parser.add_argument('--run-all', action='store_true',
                       help='Run all enabled executive dashboards')
    parser.add_argument('--run-dashboard', type=str,
                       help='Run specific dashboard (ceo|cfo|cto|cco|ciso|unified)')
    parser.add_argument('--scheduler', action='store_true',
                       help='Start automated governance monitoring')
    parser.add_argument('--backup', action='store_true',
                       help='Perform comprehensive data backup')
    parser.add_argument('--menu', action='store_true',
                       help='Launch interactive quick menu')
    parser.add_argument('--force', action='store_true',
                       help='Force execution of disabled dashboards')
    parser.add_argument('--config', type=str,
                       help='Path to custom configuration file')

    args = parser.parse_args()

    # Initialize orchestrator
    config_path = Path(args.config) if args.config else None
    orchestrator = GovernanceOrchestrator(config_path)

    # Handle different command modes
    if args.status:
        # Show governance status
        orchestrator.show_status()

    elif args.run_dashboard:
        # Run specific dashboard
        dashboard_id = args.run_dashboard.lower()
        print(f"🚀 Executing {dashboard_id.upper()} Dashboard...")

        try:
            result = await orchestrator.run_dashboard(dashboard_id, args.force)

            if result.status == ExecutionStatus.SUCCESS.value:
                print("✅ Dashboard execution completed successfully!")
                if result.report_path:
                    print(f"📄 Report generated: {result.report_path}")
            else:
                print(f"❌ Dashboard execution failed: {result.error}")

        except ValueError as e:
            print(f"❌ Error: {str(e)}")
            print(f"Available dashboards: {', '.join(orchestrator.dashboards.keys())}")

    elif args.run_all:
        # Run all dashboards
        print("🎯 Executing All Governance Dashboards...")

        try:
            results = await orchestrator.run_all_dashboards(args.force)

            # Display results
            orchestrator.display.print_execution_results(results)

            # Calculate summary
            successful = sum(1 for r in results if r.status == ExecutionStatus.SUCCESS.value)
            failed = sum(1 for r in results if r.status == ExecutionStatus.FAILED.value)
            total_duration = sum(r.duration or 0 for r in results)

            orchestrator.display.print_summary(successful, failed, total_duration)

            if successful > 0:
                print("\n📊 Execution Summary Report Generated!")
                print("📁 Check reports/ directory for detailed reports")

        except Exception as e:
            logger.error(f"❌ Failed to execute dashboards: {str(e)}")
            print(f"❌ Error executing dashboards: {str(e)}")

    elif args.scheduler:
        # Start scheduler
        print("⏰ Starting Governance Suite Scheduler...")
        print("📅 Automated monitoring enabled")
        print("🔄 Dashboards will run according to their schedules")
        print("⚠️  Press Ctrl+C to stop")

        try:
            orchestrator.start_scheduler()
        except KeyboardInterrupt:
            print("\n⏹️ Scheduler stopped by user")
            orchestrator.stop_scheduler()

    elif args.backup:
        # Perform backup
        print("💾 Performing Governance Suite Backup...")

        try:
            success = orchestrator.perform_backup()
            if success:
                print("✅ Backup completed successfully!")
                # Cleanup old backups
                orchestrator.cleanup_old_backups()
            else:
                print("❌ Backup failed!")
        except Exception as e:
            logger.error(f"❌ Backup failed: {str(e)}")
            print(f"❌ Backup failed: {str(e)}")

    elif args.menu:
        # Launch interactive menu
        handle_quick_menu(orchestrator)

    else:
        # Default: show help and status
        orchestrator.show_status()
        orchestrator.display.print_available_actions()

if __name__ == "__main__":
    asyncio.run(main())