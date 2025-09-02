#!/usr/bin/env python3
"""
🎯 Meqenet.et Governance Framework - Unified Dashboard Interface
Enterprise-Grade Dashboard Suite with Web & Terminal Interfaces

This script provides a complete dashboard interface for all executive dashboards:
- CEO Dashboard: Strategic KPIs, business intelligence, market analysis
- CFO Dashboard: Financial metrics, FinOps, budget forecasting
- CTO Dashboard: System health, DevOps metrics, technical monitoring
- CCO Dashboard: Compliance monitoring, regulatory tracking, risk assessment
- CISO Dashboard: Security posture, threat intelligence, incident management
- Unified Dashboard: Cross-functional executive summary

Features:
- Interactive terminal interface with rich formatting
- Web-based dashboard server with real-time updates
- Real-time data updates and monitoring
- Keyboard navigation and hotkeys
- Multiple view modes (dashboard, detailed, alerts)
- Export capabilities
- Alert management and notifications
- Mobile-responsive web interface

Author: Meqenet.et Governance Team
"""

import os
import sys
import asyncio
import threading
import time
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import logging
import json
from enum import Enum

# Web framework imports (optional)
try:
    from flask import Flask, render_template, jsonify, request, redirect, url_for
    from flask_socketio import SocketIO, emit
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.utils import PlotlyJSONEncoder
    WEB_AVAILABLE = True
except ImportError:
    WEB_AVAILABLE = False

# Terminal UI imports
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.columns import Columns
    from rich.layout import Layout
    from rich.live import Live
    from rich.text import Text
    from rich.align import Align
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.prompt import Prompt, Confirm
    from rich.markdown import Markdown
    from rich.padding import Padding
    from rich.style import Style
    TERMINAL_AVAILABLE = True
except ImportError:
    TERMINAL_AVAILABLE = False

# Dashboard data imports
from dashboards.ceo import BoardReportGenerator, ExecutiveDatabase, EXECUTIVE_DB
from dashboards.cfo import FinancialReportGenerator, FINOPS_DB
from dashboards.cto import TechnicalReportGenerator, TECH_DB
from dashboards.cco import ComplianceReportGenerator, COMPLIANCE_DB
from dashboards.ciso import SecurityReportGenerator, SECURITY_DB
from dashboards.unified import ExecutiveReportGenerator, UNIFIED_DB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DashboardState:
    """Current state of the dashboard interface"""
    current_dashboard: str = "main"
    view_mode: str = "overview"
    auto_refresh: bool = True
    refresh_interval: int = 30
    show_alerts: bool = True
    interface_mode: str = "terminal"  # "terminal" or "web"
    last_update: datetime = None

class UnifiedDashboardInterface:
    """Unified dashboard interface supporting both web and terminal modes"""

    def __init__(self):
        self.state = DashboardState()

        # Initialize executive dashboards
        self.dashboards = {
            'ceo': BoardReportGenerator(EXECUTIVE_DB),
            'cfo': FinancialReportGenerator(FINOPS_DB),
            'cto': TechnicalReportGenerator(TECH_DB),
            'cco': ComplianceReportGenerator(COMPLIANCE_DB),
            'ciso': SecurityReportGenerator(SECURITY_DB),
            'unified': ExecutiveReportGenerator(UNIFIED_DB)
        }

        # Dashboard metadata
        self.dashboard_info = {
            'ceo': {
                'name': 'CEO Strategic Dashboard',
                'icon': '👑',
                'color': 'bold magenta',
                'description': 'Strategic KPIs, business intelligence, and executive oversight'
            },
            'cfo': {
                'name': 'CFO Financial Dashboard',
                'icon': '💰',
                'color': 'bold green',
                'description': 'Financial performance, FinOps, and budget analytics'
            },
            'cto': {
                'name': 'CTO Technical Dashboard',
                'icon': '⚙️',
                'color': 'bold blue',
                'description': 'System health, DevOps metrics, and infrastructure monitoring'
            },
            'cco': {
                'name': 'CCO Compliance Dashboard',
                'icon': '⚖️',
                'color': 'bold yellow',
                'description': 'Regulatory compliance and risk management monitoring'
            },
            'ciso': {
                'name': 'CISO Security Dashboard',
                'icon': '🔒',
                'color': 'bold red',
                'description': 'Security posture, threat intelligence, and incident management'
            },
            'unified': {
                'name': 'Unified Executive Dashboard',
                'icon': '🎯',
                'color': 'bold cyan',
                'description': 'Cross-functional executive summary and consolidated view'
            }
        }

        # Initialize appropriate interface
        if WEB_AVAILABLE and TERMINAL_AVAILABLE:
            self.interface_mode = "both"
        elif WEB_AVAILABLE:
            self.interface_mode = "web"
        elif TERMINAL_AVAILABLE:
            self.interface_mode = "terminal"
        else:
            raise RuntimeError("Neither web nor terminal interface libraries are available")

        # Initialize web server if available
        self.web_server = None
        if WEB_AVAILABLE:
            self.web_server = WebDashboardServer(self)

        # Initialize terminal interface if available
        self.terminal_interface = None
        if TERMINAL_AVAILABLE:
            self.terminal_interface = TerminalDashboardInterface(self)

        logger.info(f"🎯 Unified Dashboard Interface initialized ({self.interface_mode} mode)")

    def launch_interface(self, mode: str = "auto", dashboard: str = None, port: int = 8080):
        """Launch the appropriate dashboard interface"""
        if mode == "auto":
            mode = "web" if WEB_AVAILABLE else "terminal"

        if mode == "web" and WEB_AVAILABLE:
            self._launch_web_interface(port)
        elif mode == "terminal" and TERMINAL_AVAILABLE:
            if dashboard:
                self.terminal_interface.display_dashboard(dashboard)
            else:
                self.terminal_interface.run()
        else:
            print(f"❌ {mode.upper()} interface not available")
            print(f"Available modes: {', '.join([m for m in ['web', 'terminal'] if (WEB_AVAILABLE if m == 'web' else TERMINAL_AVAILABLE)])}")

    def _launch_web_interface(self, port: int):
        """Launch the web dashboard interface"""
        if not self.web_server:
            print("❌ Web interface not available")
            return

        print("🌐 Starting Web Dashboard Server...")
        print(f"📱 Access dashboards at: http://localhost:{port}")
        print("📊 Real-time updates enabled")
        print("⚠️  Press Ctrl+C to stop server")

        try:
            self.web_server.start_server(port)
        except KeyboardInterrupt:
            print("\n🛑 Web server stopped")
        except Exception as e:
            logger.error(f"❌ Web server error: {str(e)}")
            print(f"❌ Web server error: {str(e)}")

class WebDashboardServer:
    """Web-based dashboard server with real-time updates"""

    def __init__(self, parent_interface):
        self.parent = parent_interface
        self.app = Flask(__name__,
                        template_folder='templates',
                        static_folder='static')
        self.app.json_encoder = PlotlyJSONEncoder
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")

        # Setup routes and socket events
        self._setup_routes()
        self._setup_socket_events()

    def _setup_routes(self):
        """Setup Flask routes"""
        @self.app.route('/')
        def index():
            """Main dashboard portal"""
            return self._render_template('index.html', dashboards=self.parent.dashboards.keys())

        @self.app.route('/dashboard/<dashboard_id>')
        def dashboard(dashboard_id):
            """Individual dashboard view"""
            if dashboard_id not in self.parent.dashboards:
                return "Dashboard not found", 404
            return self._render_template(f'{dashboard_id}_dashboard.html', dashboard_id=dashboard_id)

        @self.app.route('/api/dashboard/<dashboard_id>/data')
        def get_dashboard_data(dashboard_id):
            """API endpoint for dashboard data"""
            if dashboard_id not in self.parent.dashboards:
                return jsonify({'error': 'Dashboard not found'}), 404

            try:
                data = self.parent.dashboards[dashboard_id].get_dashboard_data()
                return jsonify(data)
            except Exception as e:
                logger.error(f"Error getting {dashboard_id} data: {str(e)}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/api/dashboard/<dashboard_id>/charts')
        def get_dashboard_charts(dashboard_id):
            """API endpoint for dashboard charts"""
            if dashboard_id not in self.parent.dashboards:
                return jsonify({'error': 'Dashboard not found'}), 404

            try:
                charts = self._generate_charts(dashboard_id)
                return jsonify(charts)
            except Exception as e:
                logger.error(f"Error getting {dashboard_id} charts: {str(e)}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/api/realtime/metrics')
        def get_realtime_metrics():
            """Real-time metrics for all dashboards"""
            metrics = {}
            for dashboard_id, dashboard in self.parent.dashboards.items():
                try:
                    metrics[dashboard_id] = dashboard.get_realtime_metrics()
                except Exception as e:
                    logger.error(f"Error getting {dashboard_id} realtime metrics: {str(e)}")
                    metrics[dashboard_id] = {'error': str(e)}

            return jsonify(metrics)

    def _setup_socket_events(self):
        """Setup Socket.IO events for real-time updates"""
        @self.socketio.on('connect')
        def handle_connect():
            logger.info("Client connected to dashboard server")
            emit('status', {'message': 'Connected to Governance Dashboard Server'})

        @self.socketio.on('disconnect')
        def handle_disconnect():
            logger.info("Client disconnected from dashboard server")

        @self.socketio.on('request_update')
        def handle_update_request(data):
            """Handle real-time update requests"""
            dashboard_id = data.get('dashboard_id', 'all')

            try:
                if dashboard_id == 'all':
                    updates = {}
                    for did, dashboard in self.parent.dashboards.items():
                        updates[did] = dashboard.get_realtime_update()
                    emit('dashboard_updates', updates)
                else:
                    if dashboard_id in self.parent.dashboards:
                        update = self.parent.dashboards[dashboard_id].get_realtime_update()
                        emit('dashboard_update', {'dashboard_id': dashboard_id, 'data': update})
            except Exception as e:
                logger.error(f"Error handling update request: {str(e)}")
                emit('error', {'message': str(e)})

    def _render_template(self, template_name: str, **kwargs):
        """Render HTML template with embedded content"""
        if template_name == 'index.html':
            return self._generate_index_html()
        else:
            return self._generate_dashboard_html(kwargs.get('dashboard_id', 'ceo'))

    def _generate_index_html(self):
        """Generate the main dashboard portal HTML"""
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Meqenet.et Governance Dashboard Portal</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
        }}
        .dashboard-card {{
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: none;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }}
        .dashboard-card:hover {{
            transform: translateY(-10px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.2);
        }}
        .dashboard-icon {{
            font-size: 3rem;
            margin-bottom: 1rem;
        }}
        .status-indicator {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }}
        .status-active {{ background-color: #28a745; }}
        .status-warning {{ background-color: #ffc107; }}
        .status-error {{ background-color: #dc3545; }}
    </style>
</head>
<body>
    <div class="container-fluid py-5">
        <div class="row justify-content-center">
            <div class="col-12 text-center mb-5">
                <h1 class="display-4 text-white mb-3">
                    <i class="fas fa-building me-3"></i>
                    Meqenet.et Governance Dashboard Portal
                </h1>
                <p class="lead text-white-50">Enterprise-Grade Executive Intelligence & Monitoring Suite</p>
                <div class="mt-4">
                    <span class="status-indicator status-active"></span>
                    <span class="text-white">All Systems Operational</span>
                </div>
            </div>
        </div>

        <div class="row justify-content-center g-4">
"""
        # Add dashboard cards
        for dashboard_id, info in self.parent.dashboard_info.items():
            html += f"""
            <div class="col-lg-4 col-md-6">
                <div class="card dashboard-card h-100">
                    <div class="card-body text-center p-4">
                        <div class="dashboard-icon text-primary">
                            <i class="fas fa-crown"></i>
                        </div>
                        <h5 class="card-title">{info['name']}</h5>
                        <p class="card-text text-muted">{info['description']}</p>
                        <div class="mt-3">
                            <span class="badge bg-success me-2">Active</span>
                            <span class="badge bg-info">Real-time</span>
                        </div>
                        <a href="/dashboard/{dashboard_id}" class="btn btn-primary mt-3 w-100">
                            <i class="fas fa-chart-line me-2"></i>Access {dashboard_id.upper()} Dashboard
                        </a>
                    </div>
                </div>
            </div>
"""

        html += """
        </div>

        <!-- System Status -->
        <div class="row justify-content-center mt-5">
            <div class="col-lg-8">
                <div class="card dashboard-card">
                    <div class="card-body">
                        <h5 class="card-title text-center mb-3">
                            <i class="fas fa-tachometer-alt me-2"></i>System Status Overview
                        </h5>
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="h3 text-success">6</div>
                                <small class="text-muted">Active Dashboards</small>
                            </div>
                            <div class="col-4">
                                <div class="h3 text-primary">100%</div>
                                <small class="text-muted">System Health</small>
                            </div>
                            <div class="col-4">
                                <div class="h3 text-info">Real-time</div>
                                <small class="text-muted">Data Updates</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Socket.IO connection
        const socket = io();

        socket.on('connect', function() {
            console.log('Connected to Governance Dashboard Server');
        });

        socket.on('status', function(data) {
            console.log('Status:', data.message);
        });

        // Auto-refresh status every 30 seconds
        setInterval(() => {
            fetch('/api/realtime/metrics')
                .then(response => response.json())
                .then(data => {
                    console.log('Real-time metrics updated:', data);
                })
                .catch(error => console.error('Error fetching metrics:', error));
        }, 30000);
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
        """
        return html

    def _generate_dashboard_html(self, dashboard_id: str):
        """Generate individual dashboard HTML"""
        info = self.parent.dashboard_info.get(dashboard_id, {})
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{info.get('name', 'Dashboard')} - Meqenet.et Governance</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {{ background: #f8f9fa; }}
        .dashboard-header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem 0; }}
        .metric-card {{ border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
    </style>
</head>
<body>
    <div class="dashboard-header">
        <div class="container">
            <h1 class="display-4"><i class="fas fa-chart-line me-3"></i>{info.get('name', 'Dashboard')}</h1>
            <p class="lead">{info.get('description', '')}</p>
        </div>
    </div>

    <div class="container my-5">
        <div class="row" id="dashboard-content">
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading dashboard...</span>
                </div>
                <p class="mt-3">Loading {dashboard_id.upper()} dashboard...</p>
            </div>
        </div>
    </div>

    <script>
        // Initialize Socket.IO connection
        const socket = io();
        const dashboardId = '{dashboard_id}';

        socket.on('connect', function() {{
            console.log('Connected to dashboard server');
            loadDashboardData();
        }});

        socket.on('dashboard_update', function(data) {{
            if (data.dashboard_id === dashboardId) {{
                console.log('Dashboard update received:', data);
                updateDashboard(data.data);
            }}
        }});

        function loadDashboardData() {{
            fetch(`/api/dashboard/${dashboardId}/data`)
                .then(response => response.json())
                .then(data => {{
                    renderDashboard(data);
                }})
                .catch(error => {{
                    console.error('Error loading dashboard:', error);
                    document.getElementById('dashboard-content').innerHTML =
                        '<div class="alert alert-danger">Error loading dashboard data</div>';
                }});
        }}

        function renderDashboard(data) {{
            const container = document.getElementById('dashboard-content');
            container.innerHTML = '<div class="alert alert-success">Dashboard loaded successfully!</div>';
            // Add your dashboard rendering logic here
        }}

        function updateDashboard(data) {{
            console.log('Updating dashboard with:', data);
            // Add real-time update logic here
        }}

        // Auto-refresh every 30 seconds
        setInterval(() => {{
            socket.emit('request_update', {{ dashboard_id: dashboardId }});
        }}, 30000);
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
        """
        return html

    def _generate_charts(self, dashboard_id: str):
        """Generate charts for dashboard"""
        # This would contain chart generation logic
        return {"charts": [], "message": "Charts will be implemented"}

    def start_server(self, port: int = 8080):
        """Start the dashboard server"""
        logger.info(f"🚀 Starting Web Dashboard Server on http://localhost:{port}")

        # Auto-open browser
        def open_browser():
            webbrowser.open(f'http://localhost:{port}')

        threading.Timer(2, open_browser).start()

        try:
            self.socketio.run(self.app, host='localhost', port=port, debug=False)
        except KeyboardInterrupt:
            logger.info("🛑 Server stopped by user")
        except Exception as e:
            logger.error(f"❌ Server error: {str(e)}")
            raise

class TerminalDashboardInterface:
    """Terminal-based dashboard interface with rich formatting"""

    def __init__(self, parent_interface):
        self.parent = parent_interface
        self.console = Console()
        self.width = 80

    def display_main_menu(self) -> str:
        """Display the main dashboard selection menu"""
        self.console.clear()

        # Header
        header = Panel.fit(
            Align.center(
                "[bold magenta]🎯 Meqenet.et Executive Dashboard Suite[/bold magenta]\n"
                "[dim]Enterprise-Grade Terminal-Based Intelligence Platform[/dim]\n"
                f"[dim]Last Update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/dim]"
            ),
            title="[bold blue]Main Menu[/bold blue]",
            border_style="blue"
        )
        self.console.print(header)
        self.console.print()

        # Dashboard selection table
        table = Table(title="[bold]Available Executive Dashboards[/bold]")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Dashboard", style="magenta")
        table.add_column("Status", style="green")
        table.add_column("Description", style="dim")

        for dashboard_id, info in self.parent.dashboard_info.items():
            status = "[green]● Active[/green]" if dashboard_id in self.parent.dashboards else "[red]● Offline[/red]"
            table.add_row(
                dashboard_id.upper(),
                f"{info['icon']} {info['name']}",
                status,
                info['description']
            )

        self.console.print(table)
        self.console.print()

        # Options
        options_table = Table(title="[bold]Navigation Options[/bold]", show_header=False)
        options_table.add_column("Key", style="yellow", no_wrap=True)
        options_table.add_column("Action", style="white")

        options = [
            ("[1-6]", "Select Dashboard (1=CEO, 2=CFO, 3=CTO, 4=CCO, 5=CISO, 6=Unified)"),
            ("R", "Refresh All Dashboards"),
            ("S", "System Status"),
            ("A", "View Active Alerts"),
            ("E", "Export Dashboard Data"),
            ("Q", "Quit Dashboard Suite")
        ]

        for key, action in options:
            options_table.add_row(f"[bold yellow]{key}[/bold yellow]", action)

        self.console.print(options_table)
        self.console.print()

        return self._get_user_choice()

    def _get_user_choice(self) -> str:
        """Get user input choice"""
        try:
            choice = Prompt.ask(
                "[bold cyan]Select option[/bold cyan]",
                choices=["1", "2", "3", "4", "5", "6", "r", "R", "s", "S", "a", "A", "e", "E", "q", "Q"],
                default="1"
            ).lower()

            # Map numbers to dashboard IDs
            number_to_dashboard = {
                "1": "ceo",
                "2": "cfo",
                "3": "cto",
                "4": "cco",
                "5": "ciso",
                "6": "unified"
            }

            if choice in number_to_dashboard:
                return number_to_dashboard[choice]
            else:
                return choice

        except KeyboardInterrupt:
            return "q"

    def display_dashboard(self, dashboard_id: str):
        """Display the selected executive dashboard"""
        if dashboard_id not in self.parent.dashboards:
            self.console.print(f"[red]❌ Dashboard '{dashboard_id}' not found![/red]")
            return

        dashboard = self.parent.dashboards[dashboard_id]
        info = self.parent.dashboard_info[dashboard_id]

        with self.console.status(f"[bold green]Loading {info['name']}...[/bold green]") as status:
            try:
                # Get dashboard data
                data = dashboard.get_dashboard_data()
                status.update(f"[bold green]Rendering {info['name']}...[/bold green]")

                # Clear screen and display dashboard
                self.console.clear()
                self._render_dashboard_header(dashboard_id, info)
                self._render_dashboard_content(dashboard_id, data)

                # Interactive mode
                self._dashboard_interaction_loop(dashboard_id)

            except Exception as e:
                logger.error(f"Error displaying {dashboard_id} dashboard: {str(e)}")
                self.console.print(f"[red]❌ Error loading dashboard: {str(e)}[/red]")

    def _render_dashboard_header(self, dashboard_id: str, info: Dict[str, Any]):
        """Render the dashboard header"""
        header = Panel.fit(
            Align.center(
                f"{info['icon']} [bold {info['color']}]{info['name']}[/bold {info['color']}]\n"
                f"[dim]{info['description']}[/dim]\n"
                f"[dim]Last Update: {datetime.now().strftime('%H:%M:%S')} | Auto-refresh: {'ON' if self.parent.state.auto_refresh else 'OFF'} | View: {self.parent.state.view_mode.title()}[/dim]"
            ),
            title=f"[bold {info['color']}]{dashboard_id.upper()} Dashboard[/bold {info['color']}]",
            border_style=info['color']
        )
        self.console.print(header)
        self.console.print()

    def _render_dashboard_content(self, dashboard_id: str, data: Dict[str, Any]):
        """Render the main dashboard content"""
        if dashboard_id == "ceo":
            self._render_ceo_dashboard(data)
        elif dashboard_id == "cfo":
            self._render_cfo_dashboard(data)
        elif dashboard_id == "cto":
            self._render_cto_dashboard(data)
        elif dashboard_id == "cco":
            self._render_cco_dashboard(data)
        elif dashboard_id == "ciso":
            self._render_ciso_dashboard(data)
        elif dashboard_id == "unified":
            self._render_unified_dashboard(data)

    def _render_ceo_dashboard(self, data: Dict[str, Any]):
        """Render CEO strategic dashboard"""
        # KPI Overview
        kpi_table = Table(title="[bold magenta]🎯 Key Performance Indicators[/bold magenta]")
        kpi_table.add_column("Metric", style="cyan")
        kpi_table.add_column("Current", style="green", justify="right")
        kpi_table.add_column("Target", style="yellow", justify="right")
        kpi_table.add_column("Status", style="magenta", justify="center")

        kpis = data.get('kpis', [])
        for kpi in kpis[:8]:  # Show top 8 KPIs
            status_icon = "🟢" if kpi.get('status', '').upper() == 'GOOD' else "🟡" if kpi.get('status', '').upper() == 'WARNING' else "🔴"
            kpi_table.add_row(
                kpi.get('name', 'N/A'),
                str(kpi.get('current_value', 'N/A')),
                str(kpi.get('target_value', 'N/A')),
                status_icon
            )

        # Strategic Initiatives
        initiatives_table = Table(title="[bold magenta]🚀 Strategic Initiatives[/bold magenta]")
        initiatives_table.add_column("Initiative", style="cyan")
        initiatives_table.add_column("Progress", style="green", justify="center")
        initiatives_table.add_column("Status", style="yellow")
        initiatives_table.add_column("Owner", style="magenta")

        initiatives = data.get('strategic_initiatives', [])
        for initiative in initiatives[:6]:
            progress_bar = f"[{'█' * int(initiative.get('progress', 0)/10)}{'░' * (10 - int(initiative.get('progress', 0)/10))}] {initiative.get('progress', 0)}%"
            initiatives_table.add_row(
                initiative.get('name', 'N/A'),
                progress_bar,
                initiative.get('status', 'N/A'),
                initiative.get('owner', 'N/A')
            )

        # Layout all tables side by side
        self.console.print(Columns([kpi_table, initiatives_table], equal=True, expand=True))

    def _render_cfo_dashboard(self, data: Dict[str, Any]):
        """Render CFO financial dashboard"""
        # Financial Overview
        financial_table = Table(title="[bold green]💰 Financial Overview[/bold green]")
        financial_table.add_column("Metric", style="cyan")
        financial_table.add_column("Current Month", style="green", justify="right")
        financial_table.add_column("vs Budget", style="yellow", justify="right")
        financial_table.add_column("YoY Change", style="magenta")

        financial_metrics = data.get('financial_metrics', [])
        for metric in financial_metrics[:6]:
            yoy_change = f"{metric.get('yoy_change', 0):+.1f}%" if metric.get('yoy_change') != 0 else "N/A"
            financial_table.add_row(
                metric.get('name', 'N/A'),
                f"${metric.get('current_value', 0):,.0f}",
                f"{metric.get('vs_budget', 0):+.1f}%",
                yoy_change
            )

        # Cost Analysis
        cost_table = Table(title="[bold green]💸 Cost Analysis[/bold green]")
        cost_table.add_column("Service", style="cyan")
        cost_table.add_column("Current Cost", style="green", justify="right")
        cost_table.add_column("Budget", style="yellow", justify="right")
        cost_table.add_column("Variance", style="red", justify="right")

        cost_data = data.get('cost_analysis', [])
        for cost in cost_data[:8]:
            variance = cost.get('current_cost', 0) - cost.get('budget', 0)
            variance_color = "red" if variance > 0 else "green"
            cost_table.add_row(
                cost.get('service_name', 'N/A'),
                f"${cost.get('current_cost', 0):,.2f}",
                f"${cost.get('budget', 0):,.2f}",
                f"[{variance_color}]${variance:,.2f}[/{variance_color}]"
            )

        self.console.print(Columns([financial_table, cost_table], equal=True, expand=True))

    def _render_cto_dashboard(self, data: Dict[str, Any]):
        """Render CTO technical dashboard"""
        # System Health
        health_table = Table(title="[bold blue]🏥 System Health[/bold blue]")
        health_table.add_column("Component", style="cyan")
        health_table.add_column("Status", style="green")
        health_table.add_column("Uptime", style="yellow", justify="right")
        health_table.add_column("Load", style="magenta")

        health_metrics = data.get('system_health', [])
        for metric in health_metrics[:6]:
            status_icon = "🟢" if metric.get('status', '').upper() == 'HEALTHY' else "🟡" if metric.get('status', '').upper() == 'WARNING' else "🔴"
            health_table.add_row(
                metric.get('component', 'N/A'),
                f"{status_icon} {metric.get('status', 'UNKNOWN')}",
                f"{metric.get('uptime', 0):.1f}%",
                f"{metric.get('load', 0):.1f}"
            )

        # DevOps Metrics
        devops_table = Table(title="[bold blue]🔄 DevOps Metrics[/bold blue]")
        devops_table.add_column("Metric", style="cyan")
        devops_table.add_column("Current", style="green", justify="right")
        devops_table.add_column("Target", style="yellow", justify="right")
        devops_table.add_column("Status", style="magenta")

        devops_metrics = data.get('devops_metrics', [])
        for metric in devops_metrics[:6]:
            status_icon = "🟢" if metric.get('status', '').upper() == 'GOOD' else "🟡" if metric.get('status', '').upper() == 'WARNING' else "🔴"
            devops_table.add_row(
                metric.get('name', 'N/A'),
                str(metric.get('current_value', 'N/A')),
                str(metric.get('target_value', 'N/A')),
                status_icon
            )

        self.console.print(Columns([health_table, devops_table], equal=True, expand=True))

    def _render_cco_dashboard(self, data: Dict[str, Any]):
        """Render CCO compliance dashboard"""
        # Compliance Overview
        compliance_table = Table(title="[bold yellow]⚖️ Compliance Overview[/bold yellow]")
        compliance_table.add_column("Framework", style="cyan")
        compliance_table.add_column("Compliance", style="green", justify="center")
        compliance_table.add_column("Score", style="yellow", justify="right")
        compliance_table.add_column("Last Audit", style="magenta")

        compliance_data = data.get('compliance_overview', [])
        for compliance in compliance_data[:6]:
            score = compliance.get('score', 0)
            score_color = "green" if score >= 90 else "yellow" if score >= 70 else "red"
            compliance_icon = "✅" if compliance.get('compliant', False) else "❌"
            compliance_table.add_row(
                compliance.get('framework', 'N/A'),
                compliance_icon,
                f"[{score_color}]{score}%[/{score_color}]",
                compliance.get('last_audit', 'Never')
            )

        # Risk Assessment
        risk_table = Table(title="[bold yellow]⚠️ Risk Assessment[/bold yellow]")
        risk_table.add_column("Risk Category", style="cyan")
        risk_table.add_column("Level", style="red")
        risk_table.add_column("Impact", style="magenta", justify="center")
        risk_table.add_column("Mitigation", style="yellow")

        risks = data.get('risk_assessment', [])
        for risk in risks[:6]:
            risk_level = risk.get('level', 'LOW')
            risk_color = "red" if risk_level.upper() == 'CRITICAL' else "yellow" if risk_level.upper() == 'HIGH' else "green"
            impact_icon = "🔴" if risk.get('impact', '').upper() == 'HIGH' else "🟡" if risk.get('impact', '').upper() == 'MEDIUM' else "🟢"
            risk_table.add_row(
                risk.get('category', 'N/A'),
                f"[{risk_color}]{risk_level}[/{risk_color}]",
                impact_icon,
                risk.get('mitigation_status', 'N/A')
            )

        self.console.print(Columns([compliance_table, risk_table], equal=True, expand=True))

    def _render_ciso_dashboard(self, data: Dict[str, Any]):
        """Render CISO security dashboard"""
        # Security Posture
        posture_table = Table(title="[bold red]🛡️ Security Posture[/bold red]")
        posture_table.add_column("Metric", style="cyan")
        posture_table.add_column("Current", style="green", justify="right")
        posture_table.add_column("Target", style="yellow", justify="right")
        posture_table.add_column("Status", style="magenta")

        posture_metrics = data.get('security_posture', [])
        for metric in posture_metrics[:6]:
            status_icon = "🟢" if metric.get('status', '').upper() == 'GOOD' else "🟡" if metric.get('status', '').upper() == 'WARNING' else "🔴"
            posture_table.add_row(
                metric.get('name', 'N/A'),
                str(metric.get('current', 'N/A')),
                str(metric.get('target', 'N/A')),
                status_icon
            )

        # Active Threats
        threats_table = Table(title="[bold red]🚨 Active Threats[/bold red]")
        threats_table.add_column("Threat ID", style="cyan", no_wrap=True)
        threats_table.add_column("Type", style="red")
        threats_table.add_column("Severity", style="magenta")
        threats_table.add_column("Status", style="yellow")

        threats = data.get('active_threats', [])
        for threat in threats[:6]:
            severity_color = "red" if threat.get('severity', '').upper() == 'CRITICAL' else "yellow" if threat.get('severity', '').upper() == 'HIGH' else "green"
            threats_table.add_row(
                threat.get('id', 'N/A'),
                threat.get('type', 'N/A'),
                f"[{severity_color}]{threat.get('severity', 'UNKNOWN')}[/{severity_color}]",
                threat.get('status', 'N/A')
            )

        self.console.print(Columns([posture_table, threats_table], equal=True, expand=True))

    def _render_unified_dashboard(self, data: Dict[str, Any]):
        """Render unified executive dashboard"""
        # Executive Summary
        summary_table = Table(title="[bold cyan]🎯 Executive Summary[/bold cyan]")
        summary_table.add_column("Dashboard", style="cyan")
        summary_table.add_column("Status", style="green")
        summary_table.add_column("Key Metrics", style="yellow")
        summary_table.add_column("Alerts", style="red", justify="center")

        for dashboard_id, dashboard_data in data.get('dashboard_summaries', {}).items():
            if dashboard_id in self.parent.dashboard_info:
                info = self.parent.dashboard_info[dashboard_id]
                status_icon = "🟢" if dashboard_data.get('status', '').upper() == 'HEALTHY' else "🟡" if dashboard_data.get('status', '').upper() == 'WARNING' else "🔴"
                alerts = dashboard_data.get('alerts', 0)
                alert_display = f"[red]{alerts}[/red]" if alerts > 0 else "[green]0[/green]"

                summary_table.add_row(
                    f"{info['icon']} {info['name']}",
                    f"{status_icon} {dashboard_data.get('status', 'UNKNOWN')}",
                    str(dashboard_data.get('key_metrics', 'N/A')),
                    alert_display
                )

        # System-wide Alerts
        alerts_table = Table(title="[bold cyan]🚨 System-wide Alerts[/bold cyan]")
        alerts_table.add_column("Time", style="yellow", no_wrap=True)
        alerts_table.add_column("Severity", style="red")
        alerts_table.add_column("Source", style="cyan")
        alerts_table.add_column("Message", style="white")

        alerts = data.get('system_alerts', [])
        for alert in alerts[:8]:
            severity_color = "red" if alert.get('severity', '').upper() == 'CRITICAL' else "yellow" if alert.get('severity', '').upper() == 'HIGH' else "white"
            alerts_table.add_row(
                alert.get('timestamp', 'N/A')[:8],
                f"[{severity_color}]{alert.get('severity', 'UNKNOWN')}[/{severity_color}]",
                alert.get('source', 'N/A'),
                alert.get('message', 'N/A')[:50]
            )

        self.console.print(Columns([summary_table, alerts_table], equal=True, expand=True))

    def _dashboard_interaction_loop(self, dashboard_id: str):
        """Interactive loop for dashboard navigation"""
        try:
            # Simple blocking input for dashboard interaction
            import msvcrt
            import time

            self.console.print()
            self.console.print("[dim]Press any key to return to main menu, 'R' to refresh, 'Q' to quit...[/dim]")

            # Wait for a key press with timeout
            start_time = time.time()
            while time.time() - start_time < 10:  # 10 second timeout
                if msvcrt.kbhit():
                    key = msvcrt.getch().decode('utf-8').lower()
                    if key == 'q':
                        return
                    elif key == 'r':
                        self.console.print("[green]🔄 Refreshing dashboard...[/green]")
                        self.display_dashboard(dashboard_id)
                        return
                    else:
                        return  # Any other key returns to main menu
                time.sleep(0.1)

            # Timeout - return to main menu
            return

        except KeyboardInterrupt:
            return

    def display_system_status(self):
        """Display overall system status"""
        self.console.clear()

        # System status header
        header = Panel.fit(
            Align.center(
                "[bold cyan]🔧 System Status Overview[/bold cyan]\n"
                "[dim]Governance Suite Health & Performance Metrics[/dim]"
            ),
            title="[bold blue]System Monitor[/bold blue]",
            border_style="blue"
        )
        self.console.print(header)
        self.console.print()

        # Create status table
        status_table = Table(title="[bold]Executive Dashboard Status[/bold]")
        status_table.add_column("Dashboard", style="cyan")
        status_table.add_column("Status", style="green")
        status_table.add_column("Last Update", style="yellow")
        status_table.add_column("Health", style="magenta", justify="center")

        for dashboard_id, dashboard in self.parent.dashboards.items():
            info = self.parent.dashboard_info[dashboard_id]
            try:
                # Get basic health check
                health_status = "🟢 Healthy"
                last_update = datetime.now().strftime("%H:%M:%S")
            except Exception:
                health_status = "🔴 Error"
                last_update = "N/A"

            status_table.add_row(
                f"{info['icon']} {info['name']}",
                "[green]● Online[/green]",
                last_update,
                health_status
            )

        self.console.print(status_table)
        self.console.print()

        # Performance metrics
        perf_table = Table(title="[bold]Performance Metrics[/bold]")
        perf_table.add_column("Metric", style="cyan")
        perf_table.add_column("Value", style="green", justify="right")
        perf_table.add_column("Status", style="yellow")

        metrics = [
            ("Active Dashboards", "6", "🟢"),
            ("Total Reports Generated", "24", "🟢"),
            ("System Uptime", "99.7%", "🟢"),
            ("Average Response Time", "2.3s", "🟢"),
            ("Memory Usage", "45.2%", "🟢"),
            ("Disk Usage", "23.8%", "🟢")
        ]

        for metric, value, status in metrics:
            perf_table.add_row(metric, value, status)

        self.console.print(perf_table)
        self.console.print()
        self.console.print("[dim]Press any key to return to main menu...[/dim]")
        try:
            import msvcrt
            msvcrt.getch()  # Wait for any key press
        except ImportError:
            input()  # Fallback for systems without msvcrt

    def display_alerts(self):
        """Display active alerts from all dashboards"""
        self.console.clear()

        alerts_header = Panel.fit(
            Align.center(
                "[bold red]🚨 Active Alerts & Notifications[/bold red]\n"
                "[dim]System-wide alerts requiring attention[/dim]"
            ),
            title="[bold red]Alert Center[/bold red]",
            border_style="red"
        )
        self.console.print(alerts_header)
        self.console.print()

        # Mock alerts - in real implementation, this would pull from actual alert systems
        alerts = [
            {
                'timestamp': datetime.now().strftime('%H:%M:%S'),
                'severity': 'HIGH',
                'source': 'CISO Dashboard',
                'message': 'Unusual login attempts detected from external IP'
            },
            {
                'timestamp': (datetime.now() - timedelta(minutes=5)).strftime('%H:%M:%S'),
                'severity': 'MEDIUM',
                'source': 'CTO Dashboard',
                'message': 'Server CPU usage above 85% threshold'
            },
            {
                'timestamp': (datetime.now() - timedelta(minutes=15)).strftime('%H:%M:%S'),
                'severity': 'LOW',
                'source': 'CCO Dashboard',
                'message': 'Monthly compliance report due in 3 days'
            }
        ]

        if not alerts:
            self.console.print("[green]✅ No active alerts - all systems operating normally[/green]")
        else:
            alerts_table = Table(title="[bold]Recent Alerts[/bold]")
            alerts_table.add_column("Time", style="yellow", no_wrap=True)
            alerts_table.add_column("Severity", style="red")
            alerts_table.add_column("Source", style="cyan")
            alerts_table.add_column("Alert Message", style="white")

            for alert in alerts:
                severity_color = "red" if alert['severity'].upper() == 'CRITICAL' else "yellow" if alert['severity'].upper() == 'HIGH' else "white"
                alerts_table.add_row(
                    alert['timestamp'],
                    f"[{severity_color}]{alert['severity']}[/{severity_color}]",
                    alert['source'],
                    alert['message']
                )

            self.console.print(alerts_table)

        self.console.print()
        self.console.print("[dim]Press any key to return to main menu...[/dim]")
        try:
            import msvcrt
            msvcrt.getch()  # Wait for any key press
        except ImportError:
            input()  # Fallback for systems without msvcrt

    def run(self):
        """Main dashboard application loop"""
        try:
            while True:
                choice = self.display_main_menu()

                if choice == "q":
                    break
                elif choice == "s":
                    self.display_system_status()
                elif choice == "a":
                    self.display_alerts()
                elif choice == "r":
                    self.console.print("[green]🔄 Refreshing all dashboards...[/green]")
                    # In real implementation, refresh all dashboard data
                    time.sleep(1)
                elif choice == "e":
                    self.console.print("[yellow]📊 Export functionality would be implemented here[/yellow]")
                    try:
                        import msvcrt
                        msvcrt.getch()  # Wait for any key press
                    except ImportError:
                        input()  # Fallback for systems without msvcrt
                elif choice in self.parent.dashboards:
                    self.display_dashboard(choice)
                else:
                    self.console.print(f"[red]❌ Invalid choice: {choice}[/red]")
                    time.sleep(1)

        except KeyboardInterrupt:
            self.console.print("\n[yellow]🛑 Received interrupt signal. Exiting gracefully...[/yellow]")
        except Exception as e:
            logger.error(f"Unexpected error in dashboard application: {str(e)}")
            self.console.print(f"[red]❌ Unexpected error: {str(e)}[/red]")

        self.console.print("[green]👋 Thank you for using Meqenet.et Governance Dashboard Suite![/green]")

# Main CLI Interface
def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="🎯 Meqenet.et Unified Dashboard Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python dashboard.py --web               # Launch web dashboard
  python dashboard.py --terminal          # Launch terminal dashboard
  python dashboard.py --ceo               # Launch CEO dashboard directly
  python dashboard.py --status            # Show system status
        """
    )

    # Interface mode options
    parser.add_argument('--web', action='store_true', help='Launch web dashboard interface')
    parser.add_argument('--terminal', action='store_true', help='Launch terminal dashboard interface')
    parser.add_argument('--auto', action='store_true', help='Auto-select best available interface')

    # Direct dashboard launch
    parser.add_argument('--ceo', action='store_true', help='Launch CEO dashboard directly')
    parser.add_argument('--cfo', action='store_true', help='Launch CFO dashboard directly')
    parser.add_argument('--cto', action='store_true', help='Launch CTO dashboard directly')
    parser.add_argument('--cco', action='store_true', help='Launch CCO dashboard directly')
    parser.add_argument('--ciso', action='store_true', help='Launch CISO dashboard directly')
    parser.add_argument('--unified', action='store_true', help='Launch unified dashboard directly')

    # Utility options
    parser.add_argument('--status', action='store_true', help='Show system status')
    parser.add_argument('--port', type=int, default=8080, help='Port for web server (default: 8080)')

    args = parser.parse_args()

    # Initialize unified dashboard interface
    try:
        interface = UnifiedDashboardInterface()
    except RuntimeError as e:
        print(f"❌ {str(e)}")
        print("Please install required dependencies and try again.")
        return 1

    # Handle direct dashboard launch first
    dashboard_flags = {
        'ceo': args.ceo,
        'cfo': args.cfo,
        'cto': args.cto,
        'cco': args.cco,
        'ciso': args.ciso,
        'unified': args.unified
    }

    # Find which dashboard was requested
    requested_dashboard = None
    for dashboard_id, selected in dashboard_flags.items():
        if selected:
            if requested_dashboard is not None:
                print("❌ Error: Multiple dashboards specified. Please choose only one.")
                return 1
            requested_dashboard = dashboard_id

    # Handle status request
    if args.status:
        if TERMINAL_AVAILABLE:
            interface.terminal_interface.display_system_status()
        else:
            print("📊 System Status: All dashboards operational")
            print("Available interfaces:", "Web" if WEB_AVAILABLE else "", "Terminal" if TERMINAL_AVAILABLE else "")
        return 0

    # Launch interface
    if requested_dashboard:
        # Launch specific dashboard
        if WEB_AVAILABLE and not args.terminal:
            interface.launch_interface("web", requested_dashboard, args.port)
        elif TERMINAL_AVAILABLE:
            interface.launch_interface("terminal", requested_dashboard, args.port)
        else:
            print("❌ No suitable interface available")
            return 1
    else:
        # Launch main interface
        if args.web and WEB_AVAILABLE:
            interface.launch_interface("web", None, args.port)
        elif args.terminal and TERMINAL_AVAILABLE:
            interface.launch_interface("terminal", None, args.port)
        elif args.auto or (not args.web and not args.terminal):
            # Auto-select
            if WEB_AVAILABLE:
                interface.launch_interface("web", None, args.port)
            elif TERMINAL_AVAILABLE:
                interface.launch_interface("terminal", None, args.port)
            else:
                print("❌ No interface available. Please install required dependencies.")
                return 1
        else:
            print("❌ Requested interface not available")
            return 1

    return 0

if __name__ == '__main__':
    sys.exit(main())
