#!/usr/bin/env python3
"""
🎯 Meqenet.et Governance Suite - Visual Dashboard Orchestrator
Enterprise-Grade C-Suite Dashboard Management System

Features:
- Real-time visual dashboard interface
- Progress tracking with visual indicators
- Clean, minimal output focused on results
- Interactive dashboard generation
- Executive-level reporting

Author: Meqenet.et Governance Team
"""

import os
import sys
import json
import yaml
import sqlite3
import asyncio
import subprocess
import argparse
import logging
import schedule
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import smtplib
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.io as pio

# Handle aiohttp import with fallback
try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    aiohttp = None

# Handle email imports with fallback
try:
    from email.mime.text import MIMEText as MimeText
    from email.mime.multipart import MIMEMultipart as MimeMultipart
    EMAIL_AVAILABLE = True
except ImportError as e:
    try:
        # Fallback to legacy import names
        from email.MIMEText import MIMEText as MimeText
        from email.MIMEMultipart import MIMEMultipart as MimeMultipart
        EMAIL_AVAILABLE = True
    except ImportError:
        EMAIL_AVAILABLE = False
        MimeText = None
        MimeMultipart = None

# Configure minimal logging (only to file, not console)
def setup_minimal_logging():
    """Setup minimal logging - only to file for debugging"""
    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    # Only file handler, no console output
    file_handler = logging.FileHandler(
        logs_dir / 'governance_suite.log', 
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Set format
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    
    # Configure root logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)
    
    return logger

# Setup minimal logging
logger = setup_minimal_logging()

# Visual Dashboard Components
class DashboardDisplay:
    """Visual dashboard display manager"""
    
    def __init__(self):
        self.width = 80
        self.start_time = None
        
    def clear_screen(self):
        """Clear the terminal screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
        
    def print_header(self):
        """Print dashboard header"""
        print("=" * self.width)
        print("🎯 MEQENET.ET GOVERNANCE SUITE DASHBOARD".center(self.width))
        print("=" * self.width)
        print()
        
    def print_progress_bar(self, current: int, total: int, dashboard_name: str, status: str = "Running"):
        """Print a visual progress bar"""
        progress = current / total if total > 0 else 0
        filled_length = int(self.width * 0.6 * progress)
        bar = "█" * filled_length + "░" * (int(self.width * 0.6) - filled_length)
        
        status_icon = {
            "Running": "🔄",
            "Success": "✅",
            "Failed": "❌",
            "Pending": "⏳"
        }.get(status, "🔄")
        
        print(f"{status_icon} {dashboard_name:<25} [{bar}] {progress:.0%}")
        
    def print_status_table(self, results: List[Dict]):
        """Print a clean status table"""
        print("\n📊 EXECUTION STATUS")
        print("-" * self.width)
        
        headers = ["Dashboard", "Status", "Duration", "Report"]
        col_widths = [20, 12, 12, 30]
        
        # Print headers
        header_row = ""
        for header, width in zip(headers, col_widths):
            header_row += f"{header:<{width}}"
        print(header_row)
        print("-" * self.width)
        
        # Print results
        for result in results:
            status_icon = "✅" if result['status'] == 'success' else "❌" if result['status'] == 'failed' else "🔄"
            duration = f"{result.get('duration', 0):.1f}s" if result.get('duration') else "N/A"
            report = "Generated" if result.get('report_path') else "None"
            
            row = f"{result['name']:<20}{status_icon} {result['status']:<10}{duration:<12}{report:<30}"
            print(row)
            
    def print_summary(self, successful: int, failed: int, total_duration: float):
        """Print execution summary"""
        print("\n" + "=" * self.width)
        print("📈 EXECUTION SUMMARY".center(self.width))
        print("=" * self.width)
        
        success_rate = (successful / (successful + failed)) * 100 if (successful + failed) > 0 else 0
        
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        print(f"⏱️ Total Duration: {total_duration:.1f}s")
        print(f"🖥️ Interactive Dashboards: Generated")
        
    def print_dashboard_links(self, report_path: Optional[str] = None):
        """Print dashboard access information"""
        if report_path:
            print(f"\n🔗 Dashboard Access:")
            print(f"   📄 Execution Report: {report_path}")
            print(f"   📊 Interactive Charts: Available in reports/")
            print(f"   🖥️ HTML Dashboard: Generated")

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
GOVERNANCE_DIR = Path(__file__).parent
CONFIG_FILE = GOVERNANCE_DIR / "config" / "governance_config.yaml"
LOGS_DIR = GOVERNANCE_DIR / "logs"
REPORTS_DIR = GOVERNANCE_DIR / "reports"
BACKUP_DIR = GOVERNANCE_DIR / "backups"

# Ensure directories exist
for directory in [LOGS_DIR, REPORTS_DIR, BACKUP_DIR, CONFIG_FILE.parent]:
    directory.mkdir(exist_ok=True)

class ExecutionStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RUNNING = "running"
    SCHEDULED = "scheduled"

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class DashboardConfig:
    """Configuration for individual dashboards"""
    name: str
    script_path: str
    enabled: bool
    schedule_cron: str
    timeout_minutes: int
    dependencies: List[str]
    environment_vars: Dict[str, str]

@dataclass
class ExecutionResult:
    """Result of dashboard execution"""
    dashboard: str
    status: ExecutionStatus
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[float]
    output: str
    error_message: Optional[str]
    report_path: Optional[str]

class GovernanceConfig:
    """Governance suite configuration manager"""
    
    def __init__(self):
        self.config_path = CONFIG_FILE
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load governance configuration"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            return self.create_default_config()
    
    def create_default_config(self) -> Dict[str, Any]:
        """Create default configuration"""
        default_config = {
            "dashboards": [
                {
                    "name": "CCO Compliance Dashboard",
                    "script_path": "governance/dashboards/cco_dashboard.py",
                    "enabled": True,
                    "schedule_cron": "0 9 * * *",
                    "timeout_minutes": 10,
                    "dependencies": [],
                    "environment_vars": {}
                },
                {
                    "name": "CEO Strategic Dashboard",
                    "script_path": "governance/dashboards/ceo_dashboard.py",
                    "enabled": True,
                    "schedule_cron": "0 8 * * *",
                    "timeout_minutes": 15,
                    "dependencies": [],
                    "environment_vars": {}
                },
                {
                    "name": "CFO Financial Dashboard",
                    "script_path": "governance/dashboards/cfo_dashboard.py",
                    "enabled": True,
                    "schedule_cron": "0 9 * * *",
                    "timeout_minutes": 10,
                    "dependencies": [],
                    "environment_vars": {}
                },
                {
                    "name": "CISO Security Dashboard",
                    "script_path": "governance/dashboards/ciso_dashboard.py",
                    "enabled": True,
                    "schedule_cron": "0 10 * * *",
                    "timeout_minutes": 12,
                    "dependencies": [],
                    "environment_vars": {}
                },
                {
                    "name": "CTO Technical Dashboard",
                    "script_path": "governance/dashboards/cto_dashboard.py",
                    "enabled": True,
                    "schedule_cron": "0 11 * * *",
                    "timeout_minutes": 15,
                    "dependencies": [],
                    "environment_vars": {}
                },
                {
                    "name": "Unified Governance Dashboard",
                    "script_path": "governance/dashboards/unified_dashboard.py",
                    "enabled": True,
                    "schedule_cron": "0 12 * * *",
                    "timeout_minutes": 20,
                    "dependencies": ["CCO Compliance Dashboard", "CEO Strategic Dashboard", "CFO Financial Dashboard", "CISO Security Dashboard", "CTO Technical Dashboard"],
                    "environment_vars": {}
                }
            ],
            "notifications": {
                "email": {
                    "enabled": False,
                    "smtp_server": "smtp.gmail.com",
                    "smtp_port": 587,
                    "username": "",
                    "password": "",
                    "recipients": []
                },
                "slack": {
                    "enabled": False,
                    "webhook_url": "",
                    "channel": "#governance"
                },
                "teams": {
                    "enabled": False,
                    "webhook_url": ""
                }
            },
            "scheduling": {
                "enabled": True,
                "timezone": "UTC"
            },
            "backup": {
                "enabled": True,
                "retention_days": 30,
                "backup_schedule": "0 2 * * *"
            }
        }
        
        # Save default configuration
        with open(self.config_path, 'w') as f:
            yaml.safe_dump(default_config, f, default_flow_style=False)
        
        return default_config
    
    def get_dashboard_configs(self) -> List[DashboardConfig]:
        """Get list of dashboard configurations, supporting both list and dict format"""
        configs = []
        dashboards_config = self.config.get("dashboards", [])
        
        if isinstance(dashboards_config, dict):
            # Handle dictionary format
            for key, dashboard in dashboards_config.items():
                if isinstance(dashboard, dict):
            configs.append(DashboardConfig(
                        name=dashboard.get("name", key),
                        script_path=dashboard["script_path"],
                        enabled=dashboard["enabled"],
                        schedule_cron=dashboard["schedule_cron"],
                        timeout_minutes=dashboard["timeout_minutes"],
                        dependencies=dashboard.get("dependencies", []),
                        environment_vars=dashboard.get("environment_vars", {})
                    ))
        elif isinstance(dashboards_config, list):
            # Handle list format
            for dashboard in dashboards_config:
                if isinstance(dashboard, dict):
                    configs.append(DashboardConfig(
                        name=dashboard["name"],
                        script_path=dashboard["script_path"],
                        enabled=dashboard["enabled"],
                        schedule_cron=dashboard["schedule_cron"],
                        timeout_minutes=dashboard["timeout_minutes"],
                        dependencies=dashboard.get("dependencies", []),
                        environment_vars=dashboard.get("environment_vars", {})
            ))
        return configs

class DashboardExecutor:
    """Dashboard execution manager with visual feedback"""
    
    def __init__(self, config: GovernanceConfig, display: DashboardDisplay):
        self.config = config
        self.display = display
        self.python_executable = sys.executable
        self.working_directory = PROJECT_ROOT
    
    async def execute_dashboard(self, dashboard_config: DashboardConfig, current: int, total: int) -> ExecutionResult:
        """Execute a single dashboard with visual feedback"""
        start_time = datetime.now()
        
        # Update display
        self.display.print_progress_bar(current, total, dashboard_config.name, "Running")
        
        # Log to file only
        logger.info(f"Starting execution of {dashboard_config.name}")
            
        try:
            # Prepare script path
            script_path = Path(dashboard_config.script_path)
            if not script_path.is_absolute():
                script_path = self.working_directory / script_path
            
            # Validate script exists
            if not script_path.exists():
                raise FileNotFoundError(f"Dashboard script not found: {script_path}")
            
            # Execute dashboard
            result = await self._execute_script(script_path, dashboard_config.timeout_minutes)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            if result.returncode == 0:
                # Success
                report_path = self._find_generated_report(dashboard_config)
                return ExecutionResult(
                    dashboard=dashboard_config.name,
                    status=ExecutionStatus.SUCCESS,
                    start_time=start_time,
                    end_time=end_time,
                    duration_seconds=duration,
                    output=result.stdout,
                    error_message=None,
                    report_path=report_path
                )
            else:
                # Failed
                return ExecutionResult(
                    dashboard=dashboard_config.name,
                    status=ExecutionStatus.FAILED,
                    start_time=start_time,
                    end_time=end_time,
                    duration_seconds=duration,
                    output=result.stdout,
                    error_message=result.stderr,
                    report_path=None
                )
                
        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            return ExecutionResult(
                dashboard=dashboard_config.name,
                status=ExecutionStatus.FAILED,
                start_time=start_time,
                end_time=end_time,
                duration_seconds=duration,
                output="",
                error_message=str(e),
                report_path=None
            )
    
    async def _execute_script(self, script_path: Path, timeout_minutes: int):
        """Execute script with timeout"""
        cmd = [self.python_executable, str(script_path)]
        
        try:
            # Use asyncio.create_subprocess_exec for better async support
                    process = await asyncio.create_subprocess_exec(
                *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                cwd=str(self.working_directory)
            )
            
            # Wait for completion with timeout
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                timeout=timeout_minutes * 60
                    )
                    
            # Create result object
            class Result:
                def __init__(self, returncode, stdout, stderr):
                    self.returncode = returncode
                    self.stdout = stdout.decode('utf-8', errors='replace') if stdout else ""
                    self.stderr = stderr.decode('utf-8', errors='replace') if stderr else ""
            
            return Result(process.returncode, stdout, stderr)
                    
                except asyncio.TimeoutError:
            # Kill process if timeout
            try:
                    process.kill()
                await process.wait()
            except:
                pass
            
            class TimeoutResult:
                def __init__(self):
                    self.returncode = -1
                    self.stdout = ""
                    self.stderr = f"Dashboard execution timed out after {timeout_minutes} minutes"
            
            return TimeoutResult()
        
        except Exception as e:
            class ErrorResult:
                def __init__(self, error):
                    self.returncode = -1
                    self.stdout = ""
                    self.stderr = str(error)
            
            return ErrorResult(e)
    
    def _find_generated_report(self, dashboard_config: DashboardConfig) -> Optional[str]:
        """Find the generated report file"""
        # Look for recent reports in the reports directory
        reports_dir = REPORTS_DIR
        if not reports_dir.exists():
            return None
        
        # Look for files containing the dashboard name
        dashboard_key = dashboard_config.name.lower().replace(" ", "_")
        
        for file_path in reports_dir.rglob("*.md"):
            if dashboard_key in file_path.name.lower():
                # Check if file was created recently (within last 5 minutes)
                if (datetime.now() - datetime.fromtimestamp(file_path.stat().st_mtime)).total_seconds() < 300:
                    return str(file_path)
        
        return None

class NotificationManager:
    """Manage notifications and alerts"""
    
    def __init__(self, config: GovernanceConfig):
        self.config = config
        self.notification_config = config.config.get("notifications", {})
    
    async def send_alert(self, level: AlertLevel, title: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Send governance alert"""
        logger.info(f"📢 Sending {level.value} alert: {title}")
        
        # Format alert message
        formatted_message = self._format_alert_message(level, title, message, details)
        
        # Send via enabled channels
        tasks = []
        
        if self.notification_config.get("email", {}).get("enabled", False):
            tasks.append(self._send_email_alert(level, title, formatted_message))
        
        if self.notification_config.get("slack", {}).get("enabled", False):
            tasks.append(self._send_slack_alert(level, title, formatted_message))
        
        if self.notification_config.get("teams", {}).get("enabled", False):
            tasks.append(self._send_teams_alert(level, title, formatted_message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def _format_alert_message(self, level: AlertLevel, title: str, message: str, details: Optional[Dict[str, Any]]) -> str:
        """Format alert message"""
        level_icons = {
            AlertLevel.INFO: "ℹ️",
            AlertLevel.WARNING: "⚠️",
            AlertLevel.ERROR: "❌",
            AlertLevel.CRITICAL: "🚨"
        }
        
        formatted = f"{level_icons.get(level, '📢')} **{title}**\n\n"
        formatted += f"{message}\n\n"
        
        if details:
            formatted += "**Details:**\n"
            for key, value in details.items():
                formatted += f"- **{key.replace('_', ' ').title()}**: {value}\n"
        
        formatted += f"\n*Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}*"
        
        return formatted
    
    async def _send_email_alert(self, level: AlertLevel, title: str, message: str):
        """Send email alert"""
        try:
            if not EMAIL_AVAILABLE:
                logger.warning("⚠️ Email functionality not available - skipping email alert")
                return
                
            email_config = self.notification_config["email"]
            
            msg = MimeMultipart()
            msg['From'] = email_config["username"]
            msg['Subject'] = f"[{level.value.upper()}] Meqenet Governance Alert: {title}"
            
            # Convert markdown to HTML for better email formatting
            html_message = message.replace('\n', '<br>').replace('**', '<strong>').replace('**', '</strong>')
            msg.attach(MimeText(html_message, 'html'))
            
            server = smtplib.SMTP(email_config["smtp_server"], email_config["smtp_port"])
            server.starttls()
            server.login(email_config["username"], email_config["password"])
            
            for recipient in email_config["recipients"]:
                msg['To'] = recipient
                server.send_message(msg)
                del msg['To']
            
            server.quit()
            logger.info("✅ Email alert sent successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to send email alert: {str(e)}")
    
    async def _send_slack_alert(self, level: AlertLevel, title: str, message: str):
        """Send Slack alert"""
        try:
            if not AIOHTTP_AVAILABLE:
                logger.warning("⚠️ aiohttp not available - skipping Slack alert")
                return
                
            slack_config = self.notification_config["slack"]
            
            color_map = {
                AlertLevel.INFO: "#36a64f",
                AlertLevel.WARNING: "#ff9900",
                AlertLevel.ERROR: "#ff0000",
                AlertLevel.CRITICAL: "#990000"
            }
            
            payload = {
                "channel": slack_config["channel"],
                "attachments": [{
                    "color": color_map.get(level, "#36a64f"),
                    "title": title,
                    "text": message,
                    "footer": "Meqenet Governance Suite",
                    "ts": int(datetime.now().timestamp())
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(slack_config["webhook_url"], json=payload) as response:
                    if response.status == 200:
                        logger.info("✅ Slack alert sent successfully")
                    else:
                        logger.error(f"❌ Failed to send Slack alert: {response.status}")
                        
        except Exception as e:
            logger.error(f"❌ Failed to send Slack alert: {str(e)}")
    
    async def _send_teams_alert(self, level: AlertLevel, title: str, message: str):
        """Send Microsoft Teams alert"""
        try:
            if not AIOHTTP_AVAILABLE:
                logger.warning("⚠️ aiohttp not available - skipping Teams alert")
                return
                
            teams_config = self.notification_config["teams"]
            
            color_map = {
                AlertLevel.INFO: "0078D4",
                AlertLevel.WARNING: "FF8C00",
                AlertLevel.ERROR: "FF0000",
                AlertLevel.CRITICAL: "800000"
            }
            
            payload = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": color_map.get(level, "0078D4"),
                "summary": title,
                "sections": [{
                    "activityTitle": title,
                    "activitySubtitle": "Meqenet Governance Suite",
                    "text": message,
                    "markdown": True
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(teams_config["webhook_url"], json=payload) as response:
                    if response.status == 200:
                        logger.info("✅ Teams alert sent successfully")
                    else:
                        logger.error(f"❌ Failed to send Teams alert: {response.status}")
                        
        except Exception as e:
            logger.error(f"❌ Failed to send Teams alert: {str(e)}")

class OrchestrationVisualizationGenerator:
    """Generate interactive visualizations for orchestration metrics"""
    
    def create_execution_status_chart(self, results: List[ExecutionResult]) -> str:
        """Create a chart showing execution status of all dashboards"""
        
        # Count status types
        status_counts = {
            'Success': len([r for r in results if r.status == ExecutionStatus.SUCCESS]),
            'Failed': len([r for r in results if r.status == ExecutionStatus.FAILED]),
            'Running': len([r for r in results if r.status == ExecutionStatus.RUNNING])
        }
        
        # Create pie chart
        fig = go.Figure(data=[go.Pie(
            labels=list(status_counts.keys()),
            values=list(status_counts.values()),
            hole=.3,
            marker_colors=['green', 'red', 'orange'],
            textinfo='label+percent+value',
            textposition='auto'
        )])
        
        fig.update_layout(
            title="Dashboard Execution Status",
            height=400,
            margin=dict(l=20, r=20, t=50, b=20)
        )
        
        # Save the chart
        chart_path = REPORTS_DIR / "execution_status_chart.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_performance_metrics_chart(self, results: List[ExecutionResult]) -> str:
        """Create a chart showing performance metrics"""
        
        # Extract data
        dashboards = [r.dashboard for r in results if r.duration_seconds is not None]
        durations = [r.duration_seconds for r in results if r.duration_seconds is not None]
        colors = ['green' if r.status == ExecutionStatus.SUCCESS else 'red' for r in results if r.duration_seconds is not None]
        
        # Create bar chart
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=dashboards,
            y=durations,
            marker_color=colors,
            text=[f"{d:.1f}s" for d in durations],
            textposition='auto',
            name='Execution Time'
        ))
        
        fig.update_layout(
            title="Dashboard Execution Performance",
            xaxis_title="Dashboard",
            yaxis_title="Execution Time (seconds)",
            height=400,
            margin=dict(l=20, r=20, t=50, b=20)
        )
        
        # Save the chart
        chart_path = REPORTS_DIR / "performance_metrics_chart.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_execution_timeline_chart(self, results: List[ExecutionResult]) -> str:
        """Create a timeline chart showing execution order and duration"""
        
        # Create Gantt-like chart
        fig = go.Figure()
        
        for i, result in enumerate(results):
            if result.start_time and result.end_time:
                fig.add_trace(go.Scatter(
                    x=[result.start_time, result.end_time],
                    y=[i, i],
                    mode='lines+markers',
                    line=dict(width=8, color='green' if result.status == ExecutionStatus.SUCCESS else 'red'),
                    name=result.dashboard,
                    text=[f"Start: {result.start_time.strftime('%H:%M:%S')}", 
                          f"End: {result.end_time.strftime('%H:%M:%S')}"],
                    textposition="top center"
                ))
        
        fig.update_layout(
            title="Dashboard Execution Timeline",
            xaxis_title="Time",
            yaxis_title="Dashboard",
            yaxis=dict(
                tickmode='array',
                tickvals=list(range(len(results))),
                ticktext=[r.dashboard for r in results]
            ),
            height=max(400, len(results) * 50),
            margin=dict(l=20, r=20, t=50, b=20),
            showlegend=False
        )
        
        # Save the chart
        chart_path = REPORTS_DIR / "execution_timeline_chart.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_dashboard_health_gauge(self, results: List[ExecutionResult]) -> str:
        """Create a gauge showing overall dashboard health"""
        
        total_dashboards = len(results)
        successful_dashboards = len([r for r in results if r.status == ExecutionStatus.SUCCESS])
        health_percentage = (successful_dashboards / total_dashboards * 100) if total_dashboards > 0 else 0
        
        fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=health_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Overall Dashboard Health (%)"},
            gauge={
                'axis': {'range': [0, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 50], 'color': "red"},
                    {'range': [50, 80], 'color': "yellow"},
                    {'range': [80, 100], 'color': "green"}
                ],
                'threshold': {
                    'line': {'color': "black", 'width': 4},
                    'thickness': 0.75,
                    'value': 80
                }
            }
        ))
        
        fig.update_layout(
            height=300,
            margin=dict(l=10, r=10, t=50, b=10)
        )
        
        # Save the chart
        chart_path = REPORTS_DIR / "dashboard_health_gauge.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_error_analysis_chart(self, results: List[ExecutionResult]) -> str:
        """Create a chart analyzing error patterns"""
        
        failed_results = [r for r in results if r.status == ExecutionStatus.FAILED]
        
        if not failed_results:
            # Create a simple message chart if no failures
            fig = go.Figure()
            fig.add_annotation(
                text="🎉 No Failed Executions!<br>All dashboards executed successfully.",
                xref="paper", yref="paper",
                x=0.5, y=0.5, xanchor='center', yanchor='middle',
                showarrow=False,
                font=dict(size=20, color="green")
            )
            fig.update_layout(
                title="Error Analysis",
                height=300,
                margin=dict(l=20, r=20, t=50, b=20),
                xaxis=dict(visible=False),
                yaxis=dict(visible=False)
            )
        else:
            # Analyze error types
            error_types = {}
            for result in failed_results:
                if result.error_message:
                    # Categorize errors
                    if "timeout" in result.error_message.lower():
                        error_types["Timeout"] = error_types.get("Timeout", 0) + 1
                    elif "permission" in result.error_message.lower() or "access" in result.error_message.lower():
                        error_types["Permission"] = error_types.get("Permission", 0) + 1
                    elif "import" in result.error_message.lower() or "module" in result.error_message.lower():
                        error_types["Import/Module"] = error_types.get("Import/Module", 0) + 1
                    elif "file" in result.error_message.lower() or "directory" in result.error_message.lower():
                        error_types["File/Path"] = error_types.get("File/Path", 0) + 1
                    else:
                        error_types["Other"] = error_types.get("Other", 0) + 1
                else:
                    error_types["Unknown"] = error_types.get("Unknown", 0) + 1
            
            # Create bar chart
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=list(error_types.keys()),
                y=list(error_types.values()),
                marker_color='red',
                text=list(error_types.values()),
                textposition='auto'
            ))
            
            fig.update_layout(
                title="Error Analysis by Type",
                xaxis_title="Error Type",
                yaxis_title="Number of Occurrences",
                height=400,
                margin=dict(l=20, r=20, t=50, b=20)
            )
        
        # Save the chart
        chart_path = REPORTS_DIR / "error_analysis_chart.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_orchestration_dashboard(self, results: List[ExecutionResult]) -> str:
        """Create an integrated orchestration dashboard"""
        
        # Calculate metrics
        total_dashboards = len(results)
        successful_dashboards = len([r for r in results if r.status == ExecutionStatus.SUCCESS])
        failed_dashboards = len([r for r in results if r.status == ExecutionStatus.FAILED])
        health_percentage = (successful_dashboards / total_dashboards * 100) if total_dashboards > 0 else 0
        avg_duration = sum(r.duration_seconds or 0 for r in results) / len(results) if results else 0
        
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            specs=[
                [{"type": "indicator"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "bar"}]
            ],
            subplot_titles=("Dashboard Health", "Execution Status", 
                           "Performance Metrics", "Error Analysis")
        )
        
        # Add health gauge
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=health_percentage,
                domain={'x': [0, 1], 'y': [0, 1]},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 50], 'color': "red"},
                        {'range': [50, 80], 'color': "yellow"},
                        {'range': [80, 100], 'color': "green"}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 4},
                        'thickness': 0.75,
                        'value': 80
                    }
                },
                title={'text': "Health (%)"}
            ),
            row=1, col=1
        )
        
        # Add status pie chart
        status_counts = {
            'Success': successful_dashboards,
            'Failed': failed_dashboards
        }
        
        fig.add_trace(
            go.Pie(
                labels=list(status_counts.keys()),
                values=list(status_counts.values()),
                hole=.3,
                marker_colors=['green', 'red'],
                textinfo='percent'
            ),
            row=1, col=2
        )
        
        # Add performance bar chart
        dashboards = [r.dashboard for r in results if r.duration_seconds is not None]
        durations = [r.duration_seconds for r in results if r.duration_seconds is not None]
        colors = ['green' if r.status == ExecutionStatus.SUCCESS else 'red' for r in results if r.duration_seconds is not None]
        
        fig.add_trace(
            go.Bar(
                x=dashboards,
                y=durations,
                marker_color=colors,
                text=[f"{d:.1f}s" for d in durations],
                textposition='auto'
            ),
            row=2, col=1
        )
        
        # Add error analysis
        failed_results = [r for r in results if r.status == ExecutionStatus.FAILED]
        if failed_results:
            error_types = {}
            for result in failed_results:
                if result.error_message:
                    if "timeout" in result.error_message.lower():
                        error_types["Timeout"] = error_types.get("Timeout", 0) + 1
                    elif "file" in result.error_message.lower():
                        error_types["File/Path"] = error_types.get("File/Path", 0) + 1
                    else:
                        error_types["Other"] = error_types.get("Other", 0) + 1
                else:
                    error_types["Unknown"] = error_types.get("Unknown", 0) + 1
            
            fig.add_trace(
                go.Bar(
                    x=list(error_types.keys()),
                    y=list(error_types.values()),
                    marker_color='red',
                    text=list(error_types.values()),
                    textposition='auto'
                ),
                row=2, col=2
            )
        
        fig.update_layout(
            title_text="Governance Orchestration Dashboard",
            height=800,
            width=1000,
            showlegend=False
        )
        
        # Save the dashboard
        dashboard_path = REPORTS_DIR / "orchestration_dashboard.html"
        fig.write_html(str(dashboard_path))
        
        return str(dashboard_path)

class GovernanceOrchestrator:
    """Main orchestrator for the governance suite"""
    
    def __init__(self):
        self.config = GovernanceConfig()
        self.display = DashboardDisplay()
        self.executor = DashboardExecutor(self.config, self.display)
        self.notifications = NotificationManager(self.config)
        self.viz_generator = OrchestrationVisualizationGenerator()
        self.is_running = False
    
    async def run_all_dashboards(self, force: bool = False) -> List[ExecutionResult]:
        """Run all enabled dashboards"""
        self.display.clear_screen()
        self.display.print_header()
        
        dashboard_configs = [c for c in self.config.get_dashboard_configs() if c.enabled or force]
        results = []
        
        # Sort by dependencies (dashboards with no dependencies first)
        sorted_configs = self._sort_by_dependencies(dashboard_configs)
        
        for i, config in enumerate(sorted_configs):
            try:
                result = await self.executor.execute_dashboard(config, i + 1, len(sorted_configs))
                results.append(result)
                
                # Send alert for failures
                if result.status == ExecutionStatus.FAILED:
                    await self.notifications.send_alert(
                        AlertLevel.ERROR,
                        f"Dashboard Execution Failed: {config.name}",
                        f"The {config.name} failed to execute successfully.",
                        {
                            "error_message": result.error_message,
                            "duration": f"{result.duration_seconds:.1f} seconds",
                            "start_time": result.start_time.strftime('%Y-%m-%d %H:%M:%S')
                        }
                    )
                
            except Exception as e:
                logger.error(f"💥 Critical error executing {config.name}: {str(e)}")
                
                await self.notifications.send_alert(
                    AlertLevel.CRITICAL,
                    f"Critical Error: {config.name}",
                    f"A critical error occurred while executing {config.name}.",
                    {"exception": str(e)}
                )
        
        # Display final results
        self.display.clear_screen()
        self.display.print_header()
        
        # Show final status table
        result_dicts = []
        for result in results:
            result_dicts.append({
                'name': result.dashboard,
                'status': result.status.value,
                'duration': result.duration_seconds,
                'report_path': result.report_path
            })
        
        self.display.print_status_table(result_dicts)
        
        # Generate interactive visualizations
        print("\n📊 Generating interactive visualizations...")
        try:
            status_chart_path = self.viz_generator.create_execution_status_chart(results)
            performance_chart_path = self.viz_generator.create_performance_metrics_chart(results)
            timeline_chart_path = self.viz_generator.create_execution_timeline_chart(results)
            health_gauge_path = self.viz_generator.create_dashboard_health_gauge(results)
            error_analysis_path = self.viz_generator.create_error_analysis_chart(results)
            orchestration_dashboard_path = self.viz_generator.create_orchestration_dashboard(results)
            
            self.display.print_summary(
                successful=len([r for r in results if r.status == ExecutionStatus.SUCCESS]),
                failed=len([r for r in results if r.status == ExecutionStatus.FAILED]),
                total_duration=sum(r.duration_seconds or 0 for r in results)
            )
            self.display.print_dashboard_links(orchestration_dashboard_path)
            
        except Exception as e:
            logger.error(f"❌ Failed to generate visualizations: {str(e)}")
            # Set default paths if visualization generation fails
            status_chart_path = None
            performance_chart_path = None
            timeline_chart_path = None
            health_gauge_path = None
            error_analysis_path = None
            orchestration_dashboard_path = None
        
        # Generate summary report
        await self._generate_execution_summary(results, {
            'status_chart': status_chart_path,
            'performance_chart': performance_chart_path,
            'timeline_chart': timeline_chart_path,
            'health_gauge': health_gauge_path,
            'error_analysis': error_analysis_path,
            'orchestration_dashboard': orchestration_dashboard_path
        })
        
        logger.info("🏁 Governance suite execution completed")
        return results
    
    def _sort_by_dependencies(self, configs: List[DashboardConfig]) -> List[DashboardConfig]:
        """Sort dashboard configs by dependencies"""
        sorted_configs = []
        remaining = configs.copy()
        
        while remaining:
            # Find configs with satisfied dependencies
            ready_configs = []
            for config in remaining:
                if not config.dependencies or all(
                    any(sc.name.lower().startswith(dep.lower()) for sc in sorted_configs)
                    for dep in config.dependencies
                ):
                    ready_configs.append(config)
            
            if not ready_configs:
                # Break circular dependencies by taking the first remaining
                ready_configs = [remaining[0]]
                logger.warning(f"⚠️ Possible circular dependency detected, forcing execution of {remaining[0].name}")
            
            for config in ready_configs:
                sorted_configs.append(config)
                remaining.remove(config)
        
        return sorted_configs
    
    async def _generate_execution_summary(self, results: List[ExecutionResult], visualization_paths: Optional[Dict[str, str]] = None):
        """Generate execution summary report"""
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        summary_path = REPORTS_DIR / f"governance_execution_summary_{timestamp}.md"
        
        successful = len([r for r in results if r.status == ExecutionStatus.SUCCESS])
        failed = len([r for r in results if r.status == ExecutionStatus.FAILED])
        total_duration = sum(r.duration_seconds or 0 for r in results)
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("# 🎯 Governance Suite Execution Summary\n\n")
            f.write(f"**Execution Time**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n")
            
            f.write("## 📊 Execution Overview\n\n")
            f.write(f"- **Total Dashboards**: {len(results)}\n")
            f.write(f"- **Successful**: {successful} ✅\n")
            f.write(f"- **Failed**: {failed} ❌\n")
            f.write(f"- **Total Duration**: {total_duration:.1f} seconds\n\n")
            
            f.write("## 📋 Detailed Results\n\n")
            f.write("| Dashboard | Status | Duration | Report Generated |\n")
            f.write("|-----------|--------|----------|------------------|\n")
            
            for result in results:
                status_icon = "✅" if result.status == ExecutionStatus.SUCCESS else "❌"
                duration = f"{result.duration_seconds:.1f}s" if result.duration_seconds else "N/A"
                report = "Yes" if result.report_path else "No"
                f.write(f"| {result.dashboard} | {status_icon} {result.status.value} | {duration} | {report} |\n")
            
            if failed > 0:
                f.write("\n## ❌ Failed Executions\n\n")
                for result in [r for r in results if r.status == ExecutionStatus.FAILED]:
                    f.write(f"### {result.dashboard}\n")
                    f.write(f"**Error**: {result.error_message}\n\n")
            
            # Add interactive visualizations section
            if visualization_paths:
                f.write("\n## 📊 Interactive Visualizations\n\n")
                f.write("The following interactive visualizations are available for detailed analysis:\n\n")
                
                viz_index = 1
                if visualization_paths.get('health_gauge'):
                    f.write(f"{viz_index}. [Dashboard Health Gauge]({visualization_paths['health_gauge']})\n")
                    viz_index += 1
                if visualization_paths.get('status_chart'):
                    f.write(f"{viz_index}. [Execution Status Chart]({visualization_paths['status_chart']})\n")
                    viz_index += 1
                if visualization_paths.get('performance_chart'):
                    f.write(f"{viz_index}. [Performance Metrics]({visualization_paths['performance_chart']})\n")
                    viz_index += 1
                if visualization_paths.get('timeline_chart'):
                    f.write(f"{viz_index}. [Execution Timeline]({visualization_paths['timeline_chart']})\n")
                    viz_index += 1
                if visualization_paths.get('error_analysis'):
                    f.write(f"{viz_index}. [Error Analysis]({visualization_paths['error_analysis']})\n")
                    viz_index += 1
                if visualization_paths.get('orchestration_dashboard'):
                    f.write(f"{viz_index}. [Complete Orchestration Dashboard]({visualization_paths['orchestration_dashboard']})\n")
                
                f.write("\n### How to Use Interactive Visualizations\n\n")
                f.write("1. Click on any of the links above to open the interactive visualization\n")
                f.write("2. Hover over chart elements to see detailed data\n")
                f.write("3. Use zoom and pan controls to explore the data\n")
                f.write("4. Export charts as PNG images using the camera icon in the top-right corner\n")
        
        # Create an HTML dashboard that embeds all visualizations
        if visualization_paths and visualization_paths.get('orchestration_dashboard'):
            html_dashboard_path = REPORTS_DIR / f"orchestration_summary_{timestamp}.html"
            with open(html_dashboard_path, 'w', encoding='utf-8') as f:
                f.write(f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meqenet.et Governance Orchestration Summary</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        h1, h2, h3 {{ color: #333; }}
        .dashboard-container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .header h1 {{ margin: 0; }}
        .header p {{ margin: 5px 0 0; opacity: 0.8; }}
        .summary-stats {{ display: flex; justify-content: space-around; background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .stat-box {{ text-align: center; }}
        .stat-number {{ font-size: 2em; font-weight: bold; }}
        .stat-label {{ color: #777; }}
        .chart-row {{ display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }}
        .chart-container {{ background-color: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 15px; flex: 1; min-width: 45%; }}
        .chart-container h3 {{ margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }}
        iframe {{ border: none; width: 100%; height: 400px; }}
        .footer {{ text-align: center; margin-top: 30px; color: #777; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>🎯 Meqenet.et Governance Orchestration Summary</h1>
            <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        </div>
        
        <div class="summary-stats">
            <div class="stat-box">
                <div class="stat-number" style="color: green;">{successful}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: red;">{failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: blue;">{len(results)}</div>
                <div class="stat-label">Total Dashboards</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" style="color: purple;">{total_duration:.1f}s</div>
                <div class="stat-label">Total Duration</div>
            </div>
        </div>
        
        <div class="chart-row">
            <div class="chart-container">
                <h3>Complete Orchestration Dashboard</h3>
                <iframe src="{Path(visualization_paths['orchestration_dashboard']).name}"></iframe>
            </div>
        </div>
        
        <div class="footer">
            <p>Governance Orchestration Dashboard v2.0 with Interactive Visualizations | Next execution: Scheduled</p>
        </div>
    </div>
</body>
</html>""")
            
            logger.info(f"✅ Interactive HTML dashboard generated: {html_dashboard_path}")
        
        logger.info(f"📄 Execution summary generated: {summary_path}")
    
    async def start_scheduler(self):
        """Start the governance suite scheduler"""
        logger.info("🕒 Starting governance suite scheduler...")
        self.is_running = True
        
        # Schedule dashboard executions
        for config in self.config.get_dashboard_configs():
            if config.enabled:
                schedule.every().day.at("08:00").do(
                    lambda c=config: asyncio.create_task(self.executor.execute_dashboard(c, 0, 0)) # Placeholder for current/total
                )
        
        # Schedule backup
        if self.config.config.get("backup", {}).get("enabled", False):
            schedule.every().day.at("02:00").do(self._perform_backup)
        
        # Main scheduler loop
        while self.is_running:
            schedule.run_pending()
            await asyncio.sleep(60)  # Check every minute
    
    def stop_scheduler(self):
        """Stop the governance suite scheduler"""
        logger.info("🛑 Stopping governance suite scheduler...")
        self.is_running = False
    
    def _perform_backup(self):
        """Perform backup of governance data"""
        logger.info("💾 Starting governance data backup...")
        
        backup_timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_path = BACKUP_DIR / f"governance_backup_{backup_timestamp}"
        backup_path.mkdir(exist_ok=True)
        
        try:
            # Backup reports
            reports_backup = backup_path / "reports"
            subprocess.run(["cp", "-r", str(REPORTS_DIR), str(reports_backup)], check=True)
            
            # Backup databases
            db_backup = backup_path / "databases"
            db_backup.mkdir(exist_ok=True)
            
            for db_file in GOVERNANCE_DIR.glob("**/*.db"):
                subprocess.run(["cp", str(db_file), str(db_backup)], check=True)
            
            # Backup logs
            logs_backup = backup_path / "logs"
            subprocess.run(["cp", "-r", str(LOGS_DIR), str(logs_backup)], check=True)
            
            # Compress backup if enabled
            if self.config.config.get("backup", {}).get("compress", False):
                subprocess.run([
                    "tar", "-czf", f"{backup_path}.tar.gz", "-C", str(BACKUP_DIR), backup_path.name
                ], check=True)
                subprocess.run(["rm", "-rf", str(backup_path)], check=True)
                logger.info(f"✅ Compressed backup created: {backup_path}.tar.gz")
            else:
                logger.info(f"✅ Backup created: {backup_path}")
            
            # Clean old backups
            self._clean_old_backups()
            
        except Exception as e:
            logger.error(f"❌ Backup failed: {str(e)}")
    
    def _clean_old_backups(self):
        """Clean old backup files"""
        retention_days = self.config.config.get("backup", {}).get("retention_days", 90)
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        for backup_item in BACKUP_DIR.iterdir():
            if backup_item.stat().st_mtime < cutoff_date.timestamp():
                if backup_item.is_dir():
                    subprocess.run(["rm", "-rf", str(backup_item)], check=True)
                else:
                    backup_item.unlink()
                logger.info(f"🗑️ Cleaned old backup: {backup_item.name}")

async def main():
    """Main entry point with visual dashboard interface"""
    parser = argparse.ArgumentParser(description='🎯 Meqenet.et Governance Suite - Visual Dashboard Orchestrator')
    parser.add_argument('--run-all', action='store_true', help='Run all dashboards once')
    parser.add_argument('--run-dashboard', type=str, help='Run specific dashboard')
    parser.add_argument('--scheduler', action='store_true', help='Start scheduler')
    parser.add_argument('--force', action='store_true', help='Force execution even if disabled')
    parser.add_argument('--backup', action='store_true', help='Perform backup')
    parser.add_argument('--setup', action='store_true', help='Setup governance suite')
    
    args = parser.parse_args()
    
    orchestrator = GovernanceOrchestrator()
    
    if args.setup:
        print("🛠️ Setting up governance suite...")
        
        # Install required packages
        requirements = [
            "pyyaml", "schedule", "aiohttp", "pandas", "numpy", 
            "matplotlib", "seaborn", "plotly", "requests"
        ]
        
        for package in requirements:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)
                print(f"✅ Installed {package}")
            except subprocess.CalledProcessError:
                print(f"❌ Failed to install {package}")
        
        print("✅ Governance suite setup completed")
        
    elif args.run_all:
        await orchestrator.run_all_dashboards(force=args.force)
        
    elif args.run_dashboard:
        dashboard_configs = orchestrator.config.get_dashboard_configs()
        config = next((c for c in dashboard_configs if c.name.lower().startswith(args.run_dashboard.lower())), None)
            
            if config:
            orchestrator.display.clear_screen()
            orchestrator.display.print_header()
            print(f"🚀 Running: {config.name}")
            print()
            
            result = await orchestrator.executor.execute_dashboard(config, 1, 1)
            
            # Create result dict for display
            result_dict = {
                'name': result.dashboard,
                'status': result.status.value,
                'duration': result.duration_seconds,
                'report_path': result.report_path
            }
            
            orchestrator.display.print_status_table([result_dict])
            
                if result.error_message:
                print(f"\n❌ Error Details:")
                print(f"   {result.error_message}")
            else:
            print(f"❌ Dashboard '{args.run_dashboard}' not found")
            print("\n📋 Available dashboards:")
            for config in dashboard_configs:
                print(f"   • {config.name}")
    
    elif args.scheduler:
        print("🕒 Starting Governance Suite Scheduler...")
        print("📊 Dashboard executions will be logged to governance/logs/")
        print("🔄 Press Ctrl+C to stop the scheduler")
        try:
            await orchestrator.start_scheduler()
        except KeyboardInterrupt:
            print("\n⏹️ Scheduler stopped by user")
    
    elif args.backup:
        print("💾 Performing governance data backup...")
        orchestrator._perform_backup()
        print("✅ Backup completed successfully")
    
    else:
        # Default: run all dashboards with visual interface
        await orchestrator.run_all_dashboards()

if __name__ == "__main__":
    asyncio.run(main()) 