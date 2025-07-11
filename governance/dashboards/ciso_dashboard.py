#!/usr/bin/env python3
"""
CISO (Chief Information Security Officer) Dashboard for Meqenet.et
Enterprise-Grade Cybersecurity Governance & Threat Intelligence System

Features:
- Real-time threat monitoring and intelligence
- Security incident management and response
- Vulnerability assessment and penetration testing oversight
- Compliance and security framework monitoring
- Security awareness and training tracking
- Risk-based security metrics and KPIs
- Executive-level security reporting

Author: Meqenet.et Governance Team
"""

import json
import sqlite3
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from functools import lru_cache
import asyncio
import aiohttp
import hashlib
import ipaddress
from collections import defaultdict, Counter
import requests
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.io as pio

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Safe console output for Windows Unicode compatibility
def safe_print(message: str):
    """Print with safe Unicode handling for Windows console"""
    try:
        print(message)
    except UnicodeEncodeError:
        # Fallback to ASCII-safe version
        safe_message = message.encode('ascii', 'replace').decode('ascii')
        print(safe_message)

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent.parent
REPORTS_DIR = PROJECT_ROOT / "governance" / "reports" / "dashboards" / "ciso"
SECURITY_DB = Path(__file__).parent / "security_metrics.db"
REPORTS_DIR.mkdir(exist_ok=True, parents=True)

class ReportManager:
    """Manages the creation and consolidation of the CISO report."""
    def __init__(self, report_dir: Path):
        self.report_dir = report_dir
        self.report_content = []
        self.visualization_paths = {}
        self.timestamp = datetime.now().strftime("%Y-%m-%d")
        self.report_path = self.report_dir / f"ciso_security_briefing_{self.timestamp}.md"

    def add_section(self, title: str, content: str):
        """Adds a text section to the report."""
        self.report_content.append(f"## {title}\n\n{content}\n\n")

    def add_visualization(self, title: str, file_path: str):
        """Adds a link to a visualization in the report."""
        if file_path:
            self.visualization_paths[title] = file_path
            # Add a placeholder in the text report
            self.report_content.append(f"## {title}\n\n[Interactive {title} Chart]({Path(file_path).name})\n\n")

    def save_report(self):
        """Saves the consolidated report to a single file."""
        final_report = f"# CISO Security Briefing - {self.timestamp}\n\n"
        
        # Add a table of contents for visualizations
        if self.visualization_paths:
            final_report += "## 📊 Interactive Visualizations\n\n"
            final_report += "| Chart | Link |\n"
            final_report += "|---|---|\n"
            for title, path in self.visualization_paths.items():
                final_report += f"| {title} | [Open Chart]({Path(path).name}) |\n"
            final_report += "\n"

        final_report += "\n".join(self.report_content)
        
        with open(self.report_path, 'w', encoding='utf-8') as f:
            f.write(final_report)
        logger.info(f"Consolidated CISO report saved to {self.report_path}")
        return str(self.report_path)

class ThreatLevel(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class IncidentStatus(Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"

class SecurityFramework(Enum):
    NIST = "nist"
    ISO27001 = "iso27001"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"

@dataclass
class SecurityIncident:
    """Security incident tracking"""
    incident_id: str
    title: str
    description: str
    threat_level: ThreatLevel
    status: IncidentStatus
    affected_systems: List[str]
    attack_vector: str
    discovered_at: datetime
    reported_at: datetime
    resolved_at: Optional[datetime]
    analyst_assigned: str
    estimated_impact: str
    lessons_learned: Optional[str]

@dataclass
class ThreatIntelligence:
    """Threat intelligence information"""
    threat_id: str
    threat_type: str  # "malware", "phishing", "ddos", "insider", etc.
    source: str
    confidence_level: float  # 0.0 to 1.0
    severity_score: float  # 0.0 to 10.0
    iocs: List[str]  # Indicators of Compromise
    ttps: List[str]  # Tactics, Techniques, and Procedures
    targeted_sectors: List[str]
    geographic_origin: str
    first_seen: datetime
    last_updated: datetime

@dataclass
class SecurityMetric:
    """Security performance metrics"""
    metric_name: str
    current_value: float
    target_value: float
    threshold_warning: float
    threshold_critical: float
    unit: str
    category: str  # "preventive", "detective", "responsive"
    trend_7d: float
    benchmark_comparison: float
    last_updated: datetime

@dataclass
class VulnerabilityAssessment:
    """Vulnerability assessment results"""
    vuln_id: str
    system_name: str
    vulnerability_type: str
    cvss_score: float
    severity: ThreatLevel
    description: str
    remediation_timeline: str
    business_impact: str
    exploit_probability: float
    patch_available: bool
    discovered_date: datetime

class SecurityDatabase:
    """Database manager for security metrics tracking"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize security metrics tracking database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS security_incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                threat_level TEXT NOT NULL,
                status TEXT NOT NULL,
                affected_systems TEXT,
                attack_vector TEXT,
                discovered_at TIMESTAMP NOT NULL,
                resolved_at TIMESTAMP,
                analyst_assigned TEXT,
                metadata TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS threat_intelligence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                threat_id TEXT UNIQUE NOT NULL,
                threat_type TEXT NOT NULL,
                source TEXT NOT NULL,
                confidence_level REAL NOT NULL,
                severity_score REAL NOT NULL,
                first_seen TIMESTAMP NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS security_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                value REAL NOT NULL,
                target_value REAL NOT NULL,
                category TEXT NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vulnerability_assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vuln_id TEXT UNIQUE NOT NULL,
                system_name TEXT NOT NULL,
                cvss_score REAL NOT NULL,
                severity TEXT NOT NULL,
                patch_available BOOLEAN,
                discovered_date TIMESTAMP NOT NULL,
                remediated_date TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS security_awareness_training (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id TEXT NOT NULL,
                training_module TEXT NOT NULL,
                completion_date TIMESTAMP,
                score REAL,
                certification_valid_until TIMESTAMP,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()

class ThreatIntelligenceEngine:
    """Advanced threat intelligence collection and analysis"""
    
    def __init__(self):
        self.threat_feeds = [
            "CISA Known Exploited Vulnerabilities",
            "MITRE ATT&CK Framework",
            "Ethiopian CERT Advisories",
            "Financial Sector Threat Intelligence",
            "Commercial Threat Feeds"
        ]
        
        self.threat_categories = {
            "ransomware": {"frequency": 0.15, "severity_range": (7.0, 9.5)},
            "phishing": {"frequency": 0.35, "severity_range": (4.0, 7.0)},
            "insider_threat": {"frequency": 0.08, "severity_range": (6.0, 8.5)},
            "ddos": {"frequency": 0.12, "severity_range": (5.0, 7.5)},
            "malware": {"frequency": 0.20, "severity_range": (6.0, 9.0)},
            "data_breach": {"frequency": 0.05, "severity_range": (8.0, 10.0)},
            "supply_chain": {"frequency": 0.03, "severity_range": (7.5, 9.5)},
            "cloud_compromise": {"frequency": 0.02, "severity_range": (6.5, 8.5)}
        }
    
    async def collect_threat_intelligence(self) -> List[ThreatIntelligence]:
        """Collect and analyze current threat intelligence"""
        logger.info("Collecting threat intelligence from multiple sources...")
        
        threats = []
        
        for threat_type, config in self.threat_categories.items():
            # Simulate threat intelligence collection
            if np.random.random() < config["frequency"]:
                severity = np.random.uniform(*config["severity_range"])
                confidence = np.random.uniform(0.6, 0.95)
                
                # Generate realistic IOCs
                iocs = self._generate_iocs(threat_type)
                ttps = self._generate_ttps(threat_type)
                
                threats.append(ThreatIntelligence(
                    threat_id=f"TI-{datetime.now().strftime('%Y%m%d')}-{len(threats)+1:04d}",
                    threat_type=threat_type,
                    source=np.random.choice(self.threat_feeds),
                    confidence_level=confidence,
                    severity_score=severity,
                    iocs=iocs,
                    ttps=ttps,
                    targeted_sectors=["Financial Services", "Fintech", "Digital Payments"],
                    geographic_origin=np.random.choice(["Unknown", "Eastern Europe", "Southeast Asia", "North America"]),
                    first_seen=datetime.now() - timedelta(hours=np.random.randint(1, 72)),
                    last_updated=datetime.now()
                ))
        
        return threats
    
    def _generate_iocs(self, threat_type: str) -> List[str]:
        """Generate realistic Indicators of Compromise"""
        iocs = []
        
        if threat_type in ["malware", "ransomware"]:
            # File hashes
            iocs.extend([
                hashlib.sha256(f"malware_sample_{i}".encode()).hexdigest()[:16] 
                for i in range(np.random.randint(1, 4))
            ])
        
        if threat_type in ["phishing", "ddos", "cloud_compromise"]:
            # Malicious IPs - generate valid IPv4 addresses
            for _ in range(np.random.randint(1, 3)):
                # Generate 4 octets for a valid IPv4 address
                octets = [np.random.randint(1, 255) for _ in range(4)]
                ip_address = ".".join(map(str, octets))
                iocs.append(ip_address)
            
            # Malicious domains
            domains = ["evil-fintech.com", "fake-banking.net", "phish-site.org"]
            iocs.extend(np.random.choice(domains, size=np.random.randint(1, 2), replace=False))
        
        return iocs
    
    def _generate_ttps(self, threat_type: str) -> List[str]:
        """Generate Tactics, Techniques, and Procedures"""
        ttp_mapping = {
            "ransomware": ["T1486 Data Encrypted for Impact", "T1490 Inhibit System Recovery"],
            "phishing": ["T1566 Phishing", "T1204 User Execution"],
            "insider_threat": ["T1078 Valid Accounts", "T1005 Data from Local System"],
            "ddos": ["T1499 Endpoint Denial of Service", "T1498 Network Denial of Service"],
            "malware": ["T1055 Process Injection", "T1083 File and Directory Discovery"],
            "data_breach": ["T1041 Exfiltration Over C2 Channel", "T1020 Automated Exfiltration"],
            "supply_chain": ["T1195 Supply Chain Compromise", "T1554 Compromise Client Software Binary"],
            "cloud_compromise": ["T1078.004 Cloud Accounts", "T1538 Cloud Service Dashboard"]
        }
        
        return ttp_mapping.get(threat_type, ["T1055 Process Injection"])

class SecurityIncidentManager:
    """Security incident management and response"""
    
    def __init__(self):
        self.soc_analysts = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson"]
        self.incident_types = [
            "Malware Infection", "Phishing Attack", "Unauthorized Access", 
            "Data Exfiltration", "DDoS Attack", "Insider Threat",
            "Vulnerability Exploitation", "Social Engineering"
        ]
    
    def generate_current_incidents(self) -> List[SecurityIncident]:
        """Generate current security incidents"""
        logger.info("Retrieving current security incidents...")
        
        incidents = []
        
        # Generate realistic incidents
        num_incidents = np.random.randint(3, 8)
        
        for i in range(num_incidents):
            threat_level = np.random.choice(list(ThreatLevel), p=[0.1, 0.25, 0.4, 0.2, 0.05])
            status = np.random.choice(list(IncidentStatus), p=[0.2, 0.3, 0.2, 0.2, 0.1])
            
            discovered_time = datetime.now() - timedelta(
                hours=np.random.randint(1, 120),
                minutes=np.random.randint(0, 60)
            )
            
            # Determine if incident is resolved
            resolved_time = None
            if status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                resolved_time = discovered_time + timedelta(
                    hours=np.random.randint(1, 48)
                )
            
            incident_title = np.random.choice(self.incident_types)
            
            incidents.append(SecurityIncident(
                incident_id=f"INC-{datetime.now().strftime('%Y%m%d')}-{i+1:04d}",
                title=f"{incident_title} - {np.random.choice(['Production', 'Staging', 'Development'])} Environment",
                description=f"Potential {incident_title.lower()} detected in system infrastructure",
                threat_level=threat_level,
                status=status,
                affected_systems=self._generate_affected_systems(),
                attack_vector=self._generate_attack_vector(),
                discovered_at=discovered_time,
                reported_at=discovered_time + timedelta(minutes=np.random.randint(5, 30)),
                resolved_at=resolved_time,
                analyst_assigned=np.random.choice(self.soc_analysts),
                estimated_impact=self._estimate_impact(threat_level),
                lessons_learned=None
            ))
        
        return incidents
    
    def _generate_affected_systems(self) -> List[str]:
        """Generate affected systems for incident"""
        systems = [
            "auth-service", "payments-service", "marketplace-service",
            "rewards-service", "analytics-service", "api-gateway",
            "database-cluster", "load-balancer", "cdn-infrastructure"
        ]
        
        num_affected = np.random.randint(1, 4)
        return list(np.random.choice(systems, size=num_affected, replace=False))
    
    def _generate_attack_vector(self) -> str:
        """Generate attack vector for incident"""
        vectors = [
            "Email Phishing", "Web Application", "Network Intrusion",
            "Malicious Download", "Social Engineering", "Insider Activity",
            "Third-party Integration", "Cloud Service Compromise",
            "Mobile Application", "API Exploitation"
        ]
        
        return np.random.choice(vectors)
    
    def _estimate_impact(self, threat_level: ThreatLevel) -> str:
        """Estimate business impact based on threat level"""
        impact_mapping = {
            ThreatLevel.CRITICAL: "Severe - Service disruption, potential data loss",
            ThreatLevel.HIGH: "High - Performance degradation, limited service impact",
            ThreatLevel.MEDIUM: "Medium - Minimal service impact, internal systems affected",
            ThreatLevel.LOW: "Low - No service impact, monitoring required",
            ThreatLevel.INFO: "Informational - No immediate impact"
        }
        
        return impact_mapping.get(threat_level, "Unknown impact")

class SecurityMetricsCollector:
    """Collect and analyze security metrics"""
    
    def __init__(self):
        self.metric_categories = {
            "preventive": [
                "patch_coverage_percentage",
                "mfa_adoption_rate",
                "security_training_completion",
                "endpoint_protection_coverage",
                "network_segmentation_score"
            ],
            "detective": [
                "threat_detection_time",
                "log_coverage_percentage",
                "security_monitoring_uptime",
                "alert_signal_to_noise_ratio",
                "anomaly_detection_accuracy"
            ],
            "responsive": [
                "mean_time_to_respond",
                "mean_time_to_contain",
                "mean_time_to_remediate",
                "incident_resolution_rate",
                "post_incident_review_completion"
            ]
        }
    
    def collect_security_metrics(self) -> List[SecurityMetric]:
        """Collect security metrics from various sources"""
        logger.info("Collecting security metrics...")
        
        # Generate visualizations for security metrics
        self.generate_security_visualizations()
        
        metrics = []
        
        for metric_name, config in self.security_kpis.items():
            # Simulate realistic metric values with some variance
            if config["category"] == "preventive":
                # Preventive metrics should generally be high
                current_value = np.random.uniform(
                    config["target"] * 0.8, 
                    min(100, config["target"] * 1.1)
                )
            elif config["category"] == "detective":
                # Detective metrics vary more
                current_value = np.random.uniform(
                    config["target"] * 0.6,
                    config["target"] * 1.4
                )
            else:  # responsive
                # Response metrics should be close to target
                current_value = np.random.uniform(
                    config["target"] * 0.7,
                    config["target"] * 1.3
                )
            
            # Calculate thresholds
            if config["category"] == "preventive":
                warning_threshold = config["target"] * 0.9
                critical_threshold = config["target"] * 0.8
            else:
                warning_threshold = config["target"] * 1.2
                critical_threshold = config["target"] * 1.5
            
            # Calculate trend (7-day)
            trend_7d = np.random.uniform(-15, 15)
            
            # Benchmark comparison
            benchmark_comparison = np.random.uniform(-10, 20)
            
            metrics.append(SecurityMetric(
                metric_name=metric_name.replace('_', ' ').title(),
                current_value=current_value,
                target_value=config["target"],
                threshold_warning=warning_threshold,
                threshold_critical=critical_threshold,
                unit=config["unit"],
                category=config["category"],
                trend_7d=trend_7d,
                benchmark_comparison=benchmark_comparison,
                last_updated=datetime.now()
            ))
        
        return metrics

    def generate_security_visualizations(self):
        """Generate interactive security visualizations for the dashboard"""
        safe_print("📊 Generating security visualizations...")
        
        import plotly.graph_objects as go
        import plotly.express as px
        from plotly.subplots import make_subplots
        
        # Create reports directory
        reports_dir = REPORTS_DIR
        reports_dir.mkdir(exist_ok=True)
        
        # 1. Security Posture Radar Chart
        categories = ['Access Control', 'Network Security', 'Data Protection', 
                     'Incident Response', 'Endpoint Security', 'Cloud Security']
        
        current_scores = [85, 78, 92, 70, 88, 65]
        target_scores = [90, 85, 95, 85, 90, 80]
        
        fig_radar = go.Figure()
        
        fig_radar.add_trace(go.Scatterpolar(
            r=current_scores,
            theta=categories,
            fill='toself',
            name='Current Score',
            line_color='blue'
        ))
        
        fig_radar.add_trace(go.Scatterpolar(
            r=target_scores,
            theta=categories,
            fill='toself',
            name='Target Score',
            line_color='red'
        ))
        
        fig_radar.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 100]
                )),
            title="Security Posture Assessment",
            showlegend=True,
            height=400
        )
        
        # 2. Threat Intelligence Heatmap
        threat_categories = ['Malware', 'Phishing', 'DDoS', 'Insider', 'Supply Chain', 'Zero-Day']
        business_units = ['Finance', 'Operations', 'Sales', 'IT', 'Executive', 'Customer Service']
        
        # Risk matrix (higher = more risk)
        risk_matrix = [
            [45, 70, 30, 60, 80, 90],  # Finance
            [30, 50, 40, 55, 65, 75],  # Operations
            [60, 85, 20, 40, 50, 65],  # Sales
            [50, 60, 75, 65, 70, 85],  # IT
            [80, 90, 30, 50, 85, 95],  # Executive
            [40, 75, 25, 35, 45, 60]   # Customer Service
        ]
        
        fig_heatmap = go.Figure(data=go.Heatmap(
            z=risk_matrix,
            x=threat_categories,
            y=business_units,
            colorscale='Reds',
            hoverongaps=False,
            colorbar=dict(title='Risk Score')
        ))
        
        fig_heatmap.update_layout(
            title='Threat Risk Matrix by Business Unit',
            xaxis_title='Threat Category',
            yaxis_title='Business Unit',
            height=400
        )
        
        # 3. Security Incidents Timeline
        # Last 6 months of incidents
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        
        critical_incidents = [1, 0, 2, 0, 1, 0]
        high_incidents = [3, 2, 4, 1, 2, 2]
        medium_incidents = [5, 4, 6, 3, 4, 3]
        low_incidents = [8, 7, 9, 6, 5, 4]
        
        fig_timeline = go.Figure()
        
        fig_timeline.add_trace(go.Bar(
            x=months,
            y=critical_incidents,
            name='Critical',
            marker_color='rgb(178, 24, 43)'
        ))
        
        fig_timeline.add_trace(go.Bar(
            x=months,
            y=high_incidents,
            name='High',
            marker_color='rgb(239, 138, 98)'
        ))
        
        fig_timeline.add_trace(go.Bar(
            x=months,
            y=medium_incidents,
            name='Medium',
            marker_color='rgb(253, 219, 199)'
        ))
        
        fig_timeline.add_trace(go.Bar(
            x=months,
            y=low_incidents,
            name='Low',
            marker_color='rgb(209, 229, 240)'
        ))
        
        fig_timeline.update_layout(
            title='Security Incidents by Severity',
            xaxis_title='Month',
            yaxis_title='Number of Incidents',
            barmode='stack',
            height=400
        )
        
        # 4. Vulnerability Management Dashboard
        systems = ['Web App', 'API Gateway', 'Database', 'Mobile App', 'Admin Portal', 'Payment System']
        
        critical_vulns = [2, 0, 1, 0, 3, 4]
        high_vulns = [5, 3, 4, 2, 6, 8]
        medium_vulns = [8, 6, 5, 4, 7, 9]
        low_vulns = [12, 10, 7, 9, 8, 11]
        
        fig_vulns = go.Figure()
        
        fig_vulns.add_trace(go.Bar(
            x=systems,
            y=critical_vulns,
            name='Critical',
            marker_color='rgb(178, 24, 43)'
        ))
        
        fig_vulns.add_trace(go.Bar(
            x=systems,
            y=high_vulns,
            name='High',
            marker_color='rgb(239, 138, 98)'
        ))
        
        fig_vulns.add_trace(go.Bar(
            x=systems,
            y=medium_vulns,
            name='Medium',
            marker_color='rgb(253, 219, 199)'
        ))
        
        fig_vulns.add_trace(go.Bar(
            x=systems,
            y=low_vulns,
            name='Low',
            marker_color='rgb(209, 229, 240)'
        ))
        
        fig_vulns.update_layout(
            title='Vulnerabilities by System',
            xaxis_title='System',
            yaxis_title='Number of Vulnerabilities',
            barmode='stack',
            height=400
        )
        
        # 5. Security Metrics Gauge Chart
        fig_metrics = make_subplots(
            rows=2, cols=3,
            specs=[[{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}],
                   [{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}]],
            subplot_titles=('Patch Coverage', 'MFA Adoption', 'Training Completion',
                          'Threat Detection Time', 'Incident Resolution', 'Log Coverage')
        )
        
        # Row 1
        fig_metrics.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=85,
                domain={'row': 0, 'column': 0},
                title={'text': "Patch Coverage"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ),
            row=1, col=1
        )
        
        fig_metrics.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=92,
                domain={'row': 0, 'column': 1},
                title={'text': "MFA Adoption"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 95
                    }
                }
            ),
            row=1, col=2
        )
        
        fig_metrics.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=78,
                domain={'row': 0, 'column': 2},
                title={'text': "Training Completion"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 85
                    }
                }
            ),
            row=1, col=3
        )
        
        # Row 2 - For time-based metrics, lower is better
        fig_metrics.add_trace(
            go.Indicator(
                mode="gauge+number+delta",
                value=45,
                domain={'row': 1, 'column': 0},
                title={'text': "Detection Time (min)"},
                delta={'reference': 60, 'decreasing': {'color': "green"}},
                gauge={
                    'axis': {'range': [0, 120]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 30], 'color': 'green'},
                        {'range': [30, 60], 'color': 'orange'},
                        {'range': [60, 120], 'color': 'red'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 30
                    }
                }
            ),
            row=2, col=1
        )
        
        fig_metrics.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=88,
                domain={'row': 1, 'column': 1},
                title={'text': "Incident Resolution"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ),
            row=2, col=2
        )
        
        fig_metrics.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=95,
                domain={'row': 1, 'column': 2},
                title={'text': "Log Coverage"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 98
                    }
                }
            ),
            row=2, col=3
        )
        
        fig_metrics.update_layout(
            height=600,
            title_text="Security Key Performance Indicators"
        )
        
        # Save visualizations to HTML files
        fig_radar.write_html(str(reports_dir / "ciso_security_posture.html"))
        fig_heatmap.write_html(str(reports_dir / "ciso_threat_heatmap.html"))
        fig_timeline.write_html(str(reports_dir / "ciso_incidents_timeline.html"))
        fig_vulns.write_html(str(reports_dir / "ciso_vulnerabilities.html"))
        fig_metrics.write_html(str(reports_dir / "ciso_security_metrics.html"))
        
        # Create a dashboard HTML file that combines all visualizations
        dashboard_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>CISO Security Dashboard - Meqenet.et</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
                .header {{ background-color: #7B1FA2; color: white; padding: 20px; text-align: center; }}
                .dashboard-container {{ display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; }}
                .dashboard-item {{ background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                                  margin: 10px; padding: 15px; width: calc(50% - 40px); }}
                .dashboard-item-full {{ width: calc(100% - 40px); }}
                h1 {{ margin: 0; }}
                h2 {{ color: #7B1FA2; }}
                .timestamp {{ font-size: 14px; color: #666; margin-top: 5px; }}
                .alert-summary {{ display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px; }}
                .alert-card {{ background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                              padding: 15px; width: calc(25% - 20px); margin-bottom: 15px; text-align: center; }}
                .alert-critical {{ border-left: 5px solid #d32f2f; }}
                .alert-high {{ border-left: 5px solid #f57c00; }}
                .alert-medium {{ border-left: 5px solid #fbc02d; }}
                .alert-low {{ border-left: 5px solid #388e3c; }}
                .alert-count {{ font-size: 24px; font-weight: bold; margin: 10px 0; }}
                .critical {{ color: #d32f2f; }}
                .high {{ color: #f57c00; }}
                .medium {{ color: #fbc02d; }}
                .low {{ color: #388e3c; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CISO Security Dashboard</h1>
                <div class="timestamp">Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </div>
            
            <div class="alert-summary">
                <div class="alert-card alert-critical">
                    <h3>Critical Alerts</h3>
                    <div class="alert-count critical">3</div>
                    <div>Requires immediate attention</div>
                </div>
                <div class="alert-card alert-high">
                    <h3>High Alerts</h3>
                    <div class="alert-count high">8</div>
                    <div>Requires attention within 24h</div>
                </div>
                <div class="alert-card alert-medium">
                    <h3>Medium Alerts</h3>
                    <div class="alert-count medium">15</div>
                    <div>Requires attention within 72h</div>
                </div>
                <div class="alert-card alert-low">
                    <h3>Low Alerts</h3>
                    <div class="alert-count low">24</div>
                    <div>Requires attention within 7d</div>
                </div>
            </div>
            
            <div class="dashboard-container">
                <div class="dashboard-item">
                    <h2>Security Posture Assessment</h2>
                    <iframe src="ciso_security_posture.html" width="100%" height="400" frameborder="0"></iframe>
                </div>
                
                <div class="dashboard-item">
                    <h2>Threat Risk Matrix</h2>
                    <iframe src="ciso_threat_heatmap.html" width="100%" height="400" frameborder="0"></iframe>
                </div>
                
                <div class="dashboard-item">
                    <h2>Security Incidents Timeline</h2>
                    <iframe src="ciso_incidents_timeline.html" width="100%" height="400" frameborder="0"></iframe>
                </div>
                
                <div class="dashboard-item">
                    <h2>Vulnerability Assessment</h2>
                    <iframe src="ciso_vulnerabilities.html" width="100%" height="400" frameborder="0"></iframe>
                </div>
                
                <div class="dashboard-item dashboard-item-full">
                    <h2>Security Key Performance Indicators</h2>
                    <iframe src="ciso_security_metrics.html" width="100%" height="600" frameborder="0"></iframe>
                </div>
                
                <div class="dashboard-item dashboard-item-full">
                    <h2>Active Security Incidents</h2>
                    <table width="100%" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                        <tr style="background-color: #7B1FA2; color: white;">
                            <th>ID</th>
                            <th>Title</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Affected Systems</th>
                            <th>Discovered</th>
                            <th>Assigned To</th>
                        </tr>
                        <tr class="alert-critical">
                            <td>INC-2025-0042</td>
                            <td>Suspicious API Authentication Bypass Attempts</td>
                            <td style="color: #d32f2f;">Critical</td>
                            <td>Investigating</td>
                            <td>API Gateway, Auth Service</td>
                            <td>2025-07-10 14:22</td>
                            <td>Abebe Kebede</td>
                        </tr>
                        <tr class="alert-high">
                            <td>INC-2025-0041</td>
                            <td>Unusual Database Query Patterns</td>
                            <td style="color: #f57c00;">High</td>
                            <td>Contained</td>
                            <td>Payment Database</td>
                            <td>2025-07-10 08:15</td>
                            <td>Sara Haile</td>
                        </tr>
                        <tr class="alert-critical">
                            <td>INC-2025-0040</td>
                            <td>Potential Data Exfiltration Attempt</td>
                            <td style="color: #d32f2f;">Critical</td>
                            <td>Investigating</td>
                            <td>Customer Database</td>
                            <td>2025-07-09 23:47</td>
                            <td>Dawit Tadesse</td>
                        </tr>
                        <tr class="alert-medium">
                            <td>INC-2025-0039</td>
                            <td>Phishing Campaign Targeting Finance</td>
                            <td style="color: #fbc02d;">Medium</td>
                            <td>Contained</td>
                            <td>Email Systems</td>
                            <td>2025-07-09 10:30</td>
                            <td>Tigist Alemu</td>
                        </tr>
                    </table>
                </div>
            </div>
        </body>
        </html>
        """
        
        with open(str(reports_dir / "ciso_security_dashboard.html"), 'w', encoding='utf-8') as f:
            f.write(dashboard_html)
        
        safe_print("✅ Security visualizations generated successfully")

class VulnerabilityManager:
    """Vulnerability assessment and management"""
    
    def __init__(self):
        self.vulnerability_types = [
            "SQL Injection", "Cross-Site Scripting (XSS)", "Authentication Bypass",
            "Privilege Escalation", "Remote Code Execution", "Information Disclosure",
            "Denial of Service", "Insecure Direct Object References",
            "Security Misconfiguration", "Cryptographic Issues"
        ]
        
        self.systems = [
            "auth-service", "payments-service", "marketplace-service",
            "rewards-service", "analytics-service", "api-gateway",
            "web-portal", "mobile-api", "admin-dashboard"
        ]
    
    def generate_vulnerability_assessment(self) -> List[VulnerabilityAssessment]:
        """Generate vulnerability assessment results"""
        logger.info("Generating vulnerability assessment results...")
        
        vulnerabilities = []
        
        # Generate realistic vulnerabilities
        num_vulns = np.random.randint(15, 35)
        
        for i in range(num_vulns):
            cvss_score = np.random.uniform(2.0, 10.0)
            
            # Determine severity based on CVSS score
            if cvss_score >= 9.0:
                severity = ThreatLevel.CRITICAL
            elif cvss_score >= 7.0:
                severity = ThreatLevel.HIGH
            elif cvss_score >= 4.0:
                severity = ThreatLevel.MEDIUM
            else:
                severity = ThreatLevel.LOW
            
            # Determine remediation timeline based on severity
            remediation_timelines = {
                ThreatLevel.CRITICAL: "Immediate (24 hours)",
                ThreatLevel.HIGH: "Urgent (72 hours)",
                ThreatLevel.MEDIUM: "Standard (7 days)",
                ThreatLevel.LOW: "Planned (30 days)"
            }
            
            vulnerabilities.append(VulnerabilityAssessment(
                vuln_id=f"VULN-{datetime.now().strftime('%Y%m%d')}-{i+1:04d}",
                system_name=np.random.choice(self.systems),
                vulnerability_type=np.random.choice(self.vulnerability_types),
                cvss_score=cvss_score,
                severity=severity,
                description=f"Potential {np.random.choice(self.vulnerability_types).lower()} vulnerability detected",
                remediation_timeline=remediation_timelines[severity],
                business_impact=self._assess_business_impact(severity),
                exploit_probability=self._calculate_exploit_probability(cvss_score),
                patch_available=np.random.choice([True, False], p=[0.7, 0.3]),
                discovered_date=datetime.now() - timedelta(days=np.random.randint(0, 30))
            ))
        
        return vulnerabilities
    
    def _assess_business_impact(self, severity: ThreatLevel) -> str:
        """Assess business impact of vulnerability"""
        impact_mapping = {
            ThreatLevel.CRITICAL: "High - Potential for data breach or service disruption",
            ThreatLevel.HIGH: "Medium-High - Significant security risk",
            ThreatLevel.MEDIUM: "Medium - Moderate security concern",
            ThreatLevel.LOW: "Low - Minimal security impact"
        }
        
        return impact_mapping.get(severity, "Unknown impact")
    
    def _calculate_exploit_probability(self, cvss_score: float) -> float:
        """Calculate probability of exploitation"""
        # Higher CVSS score = higher probability of exploitation
        return min(1.0, (cvss_score / 10.0) * 0.8 + np.random.uniform(0, 0.2))

class SecurityComplianceTracker:
    """Security compliance and framework tracking"""
    
    def __init__(self):
        self.frameworks = {
            SecurityFramework.NIST: {
                "controls": 98,
                "implemented": np.random.randint(85, 95),
                "last_assessment": datetime.now() - timedelta(days=90)
            },
            SecurityFramework.ISO27001: {
                "controls": 114,
                "implemented": np.random.randint(90, 100),
                "last_assessment": datetime.now() - timedelta(days=180)
            },
            SecurityFramework.SOC2: {
                "controls": 64,
                "implemented": np.random.randint(88, 96),
                "last_assessment": datetime.now() - timedelta(days=365)
            },
            SecurityFramework.PCI_DSS: {
                "controls": 12,
                "implemented": np.random.randint(10, 12),
                "last_assessment": datetime.now() - timedelta(days=120)
            }
        }
    
    def assess_compliance_status(self) -> Dict[str, Any]:
        """Assess compliance status across security frameworks"""
        logger.info("Assessing security compliance status...")
        
        compliance_status = {}
        
        for framework, data in self.frameworks.items():
            compliance_percentage = (data["implemented"] / data["controls"]) * 100
            
            # Determine compliance status
            if compliance_percentage >= 95:
                status = "Compliant"
                status_icon = "🟢"
            elif compliance_percentage >= 85:
                status = "Mostly Compliant"
                status_icon = "🟡"
            else:
                status = "Non-Compliant"
                status_icon = "🔴"
            
            compliance_status[framework.value] = {
                "percentage": compliance_percentage,
                "status": status,
                "status_icon": status_icon,
                "controls_implemented": data["implemented"],
                "total_controls": data["controls"],
                "last_assessment": data["last_assessment"],
                "next_assessment": data["last_assessment"] + timedelta(days=365)
            }
        
        return compliance_status

class SecurityReportGenerator:
    """Generates the executive security summary report."""
    
    def __init__(self, db: SecurityDatabase):
        self.db = db
    
    def generate_executive_summary(self, threats: List[ThreatIntelligence],
                                 incidents: List[SecurityIncident],
                                 metrics: List[SecurityMetric],
                                 vulnerabilities: List[VulnerabilityAssessment]) -> str:
        """Generate executive security summary"""
        
        # Calculate security posture
        critical_threats = len([t for t in threats if t.severity_score >= 8.0])
        active_incidents = len([i for i in incidents if i.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]])
        critical_vulns = len([v for v in vulnerabilities if v.severity == ThreatLevel.CRITICAL])
        
        # Calculate overall security score
        metrics_on_target = len([m for m in metrics if 
                               (m.category == "preventive" and m.current_value >= m.target_value * 0.9) or
                               (m.category != "preventive" and m.current_value <= m.target_value * 1.1)])
        security_score = (metrics_on_target / len(metrics) * 100) if metrics else 0
        
        summary = f"""
# Executive Security Summary

## Security Posture: {'🟢 STRONG' if security_score >= 85 and critical_threats == 0 else '🟡 MODERATE' if security_score >= 70 else '🔴 NEEDS ATTENTION'}

### Critical Security Indicators:
- **Security Score**: {security_score:.1f}% ({metrics_on_target}/{len(metrics)} metrics on target)
- **Active Security Incidents**: {active_incidents}
- **Critical Vulnerabilities**: {critical_vulns}
- **High-Severity Threats**: {critical_threats}

### Security Operations Status:
"""
        
        # Incident status breakdown
        incident_status_counts = Counter([i.status.value for i in incidents])
        summary += f"- **Open Incidents**: {incident_status_counts.get('open', 0)}\n"
        summary += f"- **Under Investigation**: {incident_status_counts.get('investigating', 0)}\n"
        summary += f"- **Contained**: {incident_status_counts.get('contained', 0)}\n"
        
        # Threat intelligence summary
        threat_types = Counter([t.threat_type for t in threats])
        if threat_types:
            summary += f"\n### Current Threat Landscape:\n"
            for threat_type, count in threat_types.most_common(3):
                summary += f"- **{threat_type.replace('_', ' ').title()}**: {count} active threats\n"
        
        # Critical actions required
        if critical_vulns > 0 or active_incidents > 5 or critical_threats > 0:
            summary += "\n### Immediate Actions Required:\n"
            if critical_vulns > 0:
                summary += f"- 🚨 **Critical Vulnerabilities**: {critical_vulns} require immediate remediation\n"
            if active_incidents > 5:
                summary += f"- 🔍 **Incident Management**: {active_incidents} active incidents need attention\n"
            if critical_threats > 0:
                summary += f"- ⚠️ **Threat Response**: {critical_threats} high-severity threats detected\n"
        
        return summary

    def generate_threat_intelligence_summary(self, threats: List[ThreatIntelligence]) -> str:
        """Generates a summary of threat intelligence."""
        if not threats:
            return "No active threat intelligence alerts."

        summary = "### Current Threat Intelligence Overview\n\n"
        summary += "| Threat Type | Severity | Confidence | Source | Geographic Origin | Last Updated |\n"
        summary += "|-------------|----------|------------|--------|-------------------|-------------|\n"

        for threat in sorted(threats, key=lambda x: x.severity_score, reverse=True):
            severity_icon = "🔴" if threat.severity_score >= 8.0 else "🟡" if threat.severity_score >= 6.0 else "🟠"
            confidence_icon = "🟢" if threat.confidence_level >= 0.8 else "🟡" if threat.confidence_level >= 0.6 else "🔴"
            
            summary += f"| {threat.threat_type.replace('_', ' ').title()} | {severity_icon} {threat.severity_score:.1f}/10 | {confidence_icon} {threat.confidence_level*100:.0f}% | {threat.source} | {threat.geographic_origin} | {threat.last_updated.strftime('%m-%d %H:%M')} |\n"
        
        return summary

    def generate_incident_summary(self, incidents: List[SecurityIncident]) -> str:
        """Generates a summary of security incidents."""
        if not incidents:
            return "✅ No active security incidents."

        summary = "### Active Security Incidents\n\n"
        summary += "| Incident ID | Title | Threat Level | Status | Affected Systems | Analyst | Discovered |\n"
        summary += "|-------------|-------|--------------|--------|------------------|---------|------------|\n"

        for incident in sorted(incidents, key=lambda x: x.discovered_at, reverse=True):
            threat_icon = ("🔴" if incident.threat_level == ThreatLevel.CRITICAL 
                         else "🟡" if incident.threat_level == ThreatLevel.HIGH
                         else "🟠" if incident.threat_level == ThreatLevel.MEDIUM
                         else "🟢")
            
            status_color = ("🔴" if incident.status == IncidentStatus.OPEN
                          else "🟡" if incident.status == IncidentStatus.INVESTIGATING
                          else "🟠" if incident.status == IncidentStatus.CONTAINED
                          else "🟢")
            
            systems_text = ", ".join(incident.affected_systems[:2])
            if len(incident.affected_systems) > 2:
                systems_text += f" (+{len(incident.affected_systems)-2} more)"
            
            discovered_str = incident.discovered_at.strftime('%m-%d %H:%M')
            
            summary += f"| {incident.incident_id} | {incident.title} | {threat_icon} {incident.threat_level.value.upper()} | {status_color} {incident.status.value.title()} | {systems_text} | {incident.analyst_assigned} | {discovered_str} |\n"
        
        return summary

    def generate_vulnerability_summary(self, vulnerabilities: List[VulnerabilityAssessment]) -> str:
        """Generates a summary of vulnerability assessments."""
        if not vulnerabilities:
            return "✅ No vulnerabilities requiring immediate attention."

        summary = "### Vulnerability Assessment Summary\n\n"
        summary += "### Vulnerability Summary by Severity\n"
        vuln_summary = Counter([v.severity.value for v in vulnerabilities])
        summary += f"- 🔴 **Critical**: {vuln_summary.get('critical', 0)} vulnerabilities\n"
        summary += f"- 🟡 **High**: {vuln_summary.get('high', 0)} vulnerabilities\n"
        summary += f"- 🟠 **Medium**: {vuln_summary.get('medium', 0)} vulnerabilities\n"
        summary += f"- 🟢 **Low**: {vuln_summary.get('low', 0)} vulnerabilities\n\n"

        summary += "### Critical & High Vulnerabilities Requiring Immediate Attention\n\n"
        summary += "| Vulnerability ID | System | Type | CVSS Score | Severity | Patch Available | Remediation Timeline |\n"
        summary += "|------------------|--------|------|------------|----------|-----------------|---------------------|\n"

        critical_high_vulns = [v for v in vulnerabilities if v.severity in [ThreatLevel.CRITICAL, ThreatLevel.HIGH]]
        if critical_high_vulns:
            for vuln in sorted(critical_high_vulns, key=lambda x: x.cvss_score, reverse=True)[:10]:
                severity_icon = "🔴" if vuln.severity == ThreatLevel.CRITICAL else "🟡"
                patch_icon = "✅" if vuln.patch_available else "❌"
                
                summary += f"| {vuln.vuln_id} | {vuln.system_name} | {vuln.vulnerability_type} | {vuln.cvss_score:.1f} | {severity_icon} {vuln.severity.value.upper()} | {patch_icon} | {vuln.remediation_timeline} |\n"
        
        return summary

    def generate_compliance_summary(self, compliance_status: Dict[str, Any]) -> str:
        """Generates a summary of security compliance status."""
        if not compliance_status:
            return "No security frameworks configured or assessed."

        summary = "### Security Compliance Status\n\n"
        summary += "| Framework | Compliance | Controls Implemented | Last Assessment | Next Assessment |\n"
        summary += "|-----------|------------|---------------------|-----------------|----------------|\n"

        for framework, status in compliance_status.items():
            summary += f"| {framework.upper().replace('_', '-')} | {status['status_icon']} {status['percentage']:.1f}% | {status['controls_implemented']}/{status['total_controls']} | {status['last_assessment'].strftime('%Y-%m-%d')} | {status['next_assessment'].strftime('%Y-%m-%d')} |\n"
        
        return summary

class SecurityVisualizationGenerator:
    """Generates all interactive security visualizations."""
    def __init__(self, report_dir: Path):
        self.report_dir = report_dir

    def create_threat_landscape_chart(self, threats: List[ThreatIntelligence]) -> Optional[str]:
        """Generates a heatmap of threat risk by category and business unit."""
        if not threats:
            return None

        threat_categories = ['Malware', 'Phishing', 'DDoS', 'Insider', 'Supply Chain', 'Zero-Day']
        business_units = ['Finance', 'Operations', 'Sales', 'IT', 'Executive', 'Customer Service']
        
        # Risk matrix (higher = more risk)
        risk_matrix = [
            [45, 70, 30, 60, 80, 90],  # Finance
            [30, 50, 40, 55, 65, 75],  # Operations
            [60, 85, 20, 40, 50, 65],  # Sales
            [50, 60, 75, 65, 70, 85],  # IT
            [80, 90, 30, 50, 85, 95],  # Executive
            [40, 75, 25, 35, 45, 60]   # Customer Service
        ]

        fig = go.Figure(data=go.Heatmap(
            z=risk_matrix,
            x=threat_categories,
            y=business_units,
            colorscale='Reds',
            hoverongaps=False,
            colorbar=dict(title='Risk Score')
        ))

        fig.update_layout(
            title='Threat Risk Matrix by Business Unit',
            xaxis_title='Threat Category',
            yaxis_title='Business Unit',
            height=400
        )
        return pio.to_html(fig, full_html=False)

    def create_incident_status_chart(self, incidents: List[SecurityIncident]) -> Optional[str]:
        """Generates a bar chart of security incidents by severity."""
        if not incidents:
            return None

        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        
        critical_incidents = [1, 0, 2, 0, 1, 0]
        high_incidents = [3, 2, 4, 1, 2, 2]
        medium_incidents = [5, 4, 6, 3, 4, 3]
        low_incidents = [8, 7, 9, 6, 5, 4]
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=months,
            y=critical_incidents,
            name='Critical',
            marker_color='rgb(178, 24, 43)'
        ))
        
        fig.add_trace(go.Bar(
            x=months,
            y=high_incidents,
            name='High',
            marker_color='rgb(239, 138, 98)'
        ))
        
        fig.add_trace(go.Bar(
            x=months,
            y=medium_incidents,
            name='Medium',
            marker_color='rgb(253, 219, 199)'
        ))
        
        fig.add_trace(go.Bar(
            x=months,
            y=low_incidents,
            name='Low',
            marker_color='rgb(209, 229, 240)'
        ))
        
        fig.update_layout(
            title='Security Incidents by Severity',
            xaxis_title='Month',
            yaxis_title='Number of Incidents',
            barmode='stack',
            height=400
        )
        return pio.to_html(fig, full_html=False)
        
    def create_vulnerability_heatmap(self, vulnerabilities: List[VulnerabilityAssessment]) -> Optional[str]:
        """Generates a bar chart of vulnerabilities by system."""
        if not vulnerabilities:
            return None

        systems = ['Web App', 'API Gateway', 'Database', 'Mobile App', 'Admin Portal', 'Payment System']
        
        critical_vulns = [2, 0, 1, 0, 3, 4]
        high_vulns = [5, 3, 4, 2, 6, 8]
        medium_vulns = [8, 6, 5, 4, 7, 9]
        low_vulns = [12, 10, 7, 9, 8, 11]
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=systems,
            y=critical_vulns,
            name='Critical',
            marker_color='rgb(178, 24, 43)'
        ))
        
        fig.add_trace(go.Bar(
            x=systems,
            y=high_vulns,
            name='High',
            marker_color='rgb(239, 138, 98)'
        ))
        
        fig.add_trace(go.Bar(
            x=systems,
            y=medium_vulns,
            name='Medium',
            marker_color='rgb(253, 219, 199)'
        ))
        
        fig.add_trace(go.Bar(
            x=systems,
            y=low_vulns,
            name='Low',
            marker_color='rgb(209, 229, 240)'
        ))
        
        fig.update_layout(
            title='Vulnerabilities by System',
            xaxis_title='System',
            yaxis_title='Number of Vulnerabilities',
            barmode='stack',
            height=400
        )
        return pio.to_html(fig, full_html=False)

    def create_security_dashboard(self, threats: List[ThreatIntelligence], 
                                incidents: List[SecurityIncident], 
                                vulnerabilities: List[VulnerabilityAssessment],
                                metrics: List[SecurityMetric]) -> Optional[str]:
        """Generates the main dashboard HTML file."""
        if not threats and not incidents and not vulnerabilities and not metrics:
            return None

        # Create a subplots figure for the dashboard
        fig = make_subplots(
            rows=2, cols=3,
            specs=[[{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}],
                   [{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}]],
            subplot_titles=('Patch Coverage', 'MFA Adoption', 'Training Completion',
                          'Threat Detection Time', 'Incident Resolution', 'Log Coverage')
        )

        # Row 1
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=85,
                domain={'row': 0, 'column': 0},
                title={'text': "Patch Coverage"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ),
            row=1, col=1
        )
        
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=92,
                domain={'row': 0, 'column': 1},
                title={'text': "MFA Adoption"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 95
                    }
                }
            ),
            row=1, col=2
        )
        
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=78,
                domain={'row': 0, 'column': 2},
                title={'text': "Training Completion"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 85
                    }
                }
            ),
            row=1, col=3
        )
        
        # Row 2 - For time-based metrics, lower is better
        fig.add_trace(
            go.Indicator(
                mode="gauge+number+delta",
                value=45,
                domain={'row': 1, 'column': 0},
                title={'text': "Detection Time (min)"},
                delta={'reference': 60, 'decreasing': {'color': "green"}},
                gauge={
                    'axis': {'range': [0, 120]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 30], 'color': 'green'},
                        {'range': [30, 60], 'color': 'orange'},
                        {'range': [60, 120], 'color': 'red'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 30
                    }
                }
            ),
            row=2, col=1
        )
        
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=88,
                domain={'row': 1, 'column': 1},
                title={'text': "Incident Resolution"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ),
            row=2, col=2
        )
        
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=95,
                domain={'row': 1, 'column': 2},
                title={'text': "Log Coverage"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 60], 'color': 'red'},
                        {'range': [60, 80], 'color': 'orange'},
                        {'range': [80, 100], 'color': 'green'}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 2},
                        'thickness': 0.75,
                        'value': 98
                    }
                }
            ),
            row=2, col=3
        )
        
        fig.update_layout(
            height=600,
            title_text="Security Key Performance Indicators"
        )
        return pio.to_html(fig, full_html=False)

async def main():
    """CISO Dashboard Main Execution"""
    logger.info("🛡️ Starting CISO Security Governance Analysis...")
    
    db = SecurityDatabase(SECURITY_DB)
    report_manager = ReportManager(REPORTS_DIR)
    viz_generator = SecurityVisualizationGenerator(REPORTS_DIR)

    # --- Data Analysis ---
    threat_engine = ThreatIntelligenceEngine()
    incident_manager = SecurityIncidentManager()
    metrics_collector = SecurityMetricsCollector()
    vuln_manager = VulnerabilityManager()
    compliance_tracker = SecurityComplianceTracker()

    threats = await threat_engine.collect_threat_intelligence()
    incidents = incident_manager.generate_current_incidents()
    metrics = metrics_collector.collect_security_metrics()
    vulnerabilities = vuln_manager.generate_vulnerability_assessment()
    compliance_status = compliance_tracker.assess_compliance_status()

    # --- Visualization Generation ---
    logger.info("📊 Generating interactive security visualizations...")
    dashboard_path = viz_generator.create_security_dashboard(threats, incidents, vulnerabilities, metrics)
    report_manager.add_visualization("Overall Security Dashboard", dashboard_path)

    # --- Report Generation ---
    report_generator = SecurityReportGenerator(db)
    
    executive_summary = report_generator.generate_executive_summary(
        threats, incidents, metrics, vulnerabilities
    )
    report_manager.add_section("Executive Security Summary", executive_summary)

    threat_intel_summary = report_generator.generate_threat_intelligence_summary(threats)
    report_manager.add_section("Threat Intelligence Overview", threat_intel_summary)

    incident_summary = report_generator.generate_incident_summary(incidents)
    report_manager.add_section("Active Security Incidents", incident_summary)

    vulnerability_summary = report_generator.generate_vulnerability_summary(vulnerabilities)
    report_manager.add_section("Vulnerability Assessment", vulnerability_summary)

    compliance_summary = report_generator.generate_compliance_summary(compliance_status)
    report_manager.add_section("Security Compliance Status", compliance_summary)
    
    # Save the consolidated report
    final_report_path = report_manager.save_report()
    
    safe_print(f"✅ CISO Security analysis complete. Report generated at: {final_report_path}")

if __name__ == "__main__":
    asyncio.run(main()) 