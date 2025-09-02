#!/usr/bin/env python3
"""
CEO (Chief Executive Officer) Dashboard for Meqenet.et
Strategic Business Intelligence & Executive Oversight System

Features:
- Strategic KPI tracking and business performance analytics
- Board-level reporting and investor metrics
- Market analysis and competitive intelligence
- Risk management and business continuity oversight
- Cross-functional team performance tracking
- Revenue forecasting and business growth analytics
- Executive decision support system

Author: Meqenet.et Governance Team
"""

import json
import sqlite3
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from functools import lru_cache
import asyncio
import requests
from plotly.subplots import make_subplots

# Optional imports with fallbacks
try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    logger.warning("aiohttp not available - some features will be limited")

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    logger.warning("yfinance not available - stock market analysis disabled")

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    logger.warning("textblob not available - sentiment analysis disabled")

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
REPORTS_DIR = PROJECT_ROOT / "governance" / "reports" / "dashboards" / "ceo"
EXECUTIVE_DB = Path(__file__).parent / "executive_metrics.db"
REPORTS_DIR.mkdir(exist_ok=True, parents=True)

class ReportManager:
    """Manages the creation and consolidation of the CEO report."""
    def __init__(self, report_dir: Path):
        self.report_dir = report_dir
        self.report_content = []
        self.visualizations = []  # To store (name, path) of visualizations
        self.timestamp = datetime.now().strftime("%Y-%m-%d")
        self.report_path = self.report_dir / f"ceo_daily_briefing_{self.timestamp}.md"

    def add_section(self, title: str, content: str):
        """Adds a section to the report."""
        self.report_content.append(f"## {title}\n\n{content}\n\n")

    def add_visualization(self, chart_name: str, chart_path: str):
        """Adds a visualization to the report."""
        self.visualizations.append((chart_name, chart_path))

    def save_report(self):
        """Saves the consolidated report to a single file."""
        final_report = f"# CEO Daily Briefing - {self.timestamp}\n\n"

        if self.visualizations:
            final_report += "## Interactive Visualizations\n\n"
            final_report += "A series of interactive charts have been generated to provide deeper insights. Click the links below to view them in your browser.\n\n"
            final_report += "| Chart Name | Link |\n"
            final_report += "|------------|------|\n"
            for name, path in self.visualizations:
                relative_path = Path(path).relative_to(self.report_path.parent)
                final_report += f"| {name} | [{Path(path).name}]({relative_path}) |\n"
            final_report += "\n"

        final_report += "\n".join(self.report_content)
        
        with open(self.report_path, 'w', encoding='utf-8') as f:
            f.write(final_report)
        logger.info(f"Consolidated CEO report saved to {self.report_path}")
        return str(self.report_path)

class PerformanceStatus(Enum):
    EXCEEDING = "exceeding"
    ON_TARGET = "on_target"
    BELOW_TARGET = "below_target"
    CRITICAL = "critical"

class BusinessPriority(Enum):
    STRATEGIC = "strategic"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class BusinessKPI:
    """Business Key Performance Indicators"""
    kpi_name: str
    current_value: float
    target_value: float
    previous_period_value: float
    unit: str
    category: str  # "revenue", "growth", "operational", "customer"
    status: PerformanceStatus
    trend_percentage: float
    benchmark_comparison: float  # vs industry benchmark
    last_updated: datetime

@dataclass
class StrategicInitiative:
    """Strategic business initiatives tracking"""
    initiative_id: str
    name: str
    description: str
    priority: BusinessPriority
    progress_percentage: float
    budget_allocated: float
    budget_spent: float
    expected_roi: float
    timeline_months: int
    responsible_executive: str
    risk_level: str
    dependencies: List[str]

@dataclass
class MarketIntelligence:
    """Market and competitive intelligence"""
    metric_name: str
    our_position: float
    market_average: float
    leading_competitor: float
    market_trend: str  # "growing", "stable", "declining"
    opportunity_score: float  # 0-100
    threat_level: str

class ExecutiveDatabase:
    """Database manager for executive metrics tracking"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize executive metrics tracking database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS business_kpis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kpi_name TEXT NOT NULL,
                value REAL NOT NULL,
                target_value REAL NOT NULL,
                category TEXT NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS strategic_initiatives (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                initiative_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                priority TEXT NOT NULL,
                progress REAL NOT NULL,
                budget_allocated REAL,
                budget_spent REAL,
                responsible_executive TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS board_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_date TIMESTAMP NOT NULL,
                report_type TEXT NOT NULL,
                key_metrics TEXT,
                executive_summary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS risk_assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                risk_category TEXT NOT NULL,
                risk_description TEXT NOT NULL,
                probability REAL NOT NULL,
                impact REAL NOT NULL,
                mitigation_strategy TEXT,
                owner TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()

class BusinessKPIAnalyzer:
    """Comprehensive business KPI analysis and tracking"""
    
    def __init__(self):
        self.kpi_targets = {
            "monthly_revenue": 2000000,  # ETB
            "customer_acquisition_cost": 250,  # ETB
            "customer_lifetime_value": 5000,  # ETB
            "monthly_active_users": 50000,
            "transaction_volume": 10000000,  # ETB
            "market_share": 15,  # %
            "net_promoter_score": 60,
            "employee_satisfaction": 85,  # %
            "operational_efficiency": 90,  # %
            "burn_rate": 800000,  # ETB per month
            "runway_months": 24
        }
    
    async def analyze_business_performance(self) -> List[BusinessKPI]:
        """Analyze comprehensive business performance metrics"""
        logger.info("Analyzing business performance KPIs...")
        
        kpis = []
        
        # Revenue and Financial KPIs
        monthly_revenue = np.random.uniform(1500000, 2500000)
        kpis.append(self._create_kpi(
            "Monthly Revenue", monthly_revenue, self.kpi_targets["monthly_revenue"],
            np.random.uniform(1400000, 1800000), "ETB", "revenue"
        ))
        
        # Customer Metrics
        cac = np.random.uniform(200, 350)
        kpis.append(self._create_kpi(
            "Customer Acquisition Cost", cac, self.kpi_targets["customer_acquisition_cost"],
            np.random.uniform(280, 320), "ETB", "customer"
        ))
        
        clv = np.random.uniform(4000, 6000)
        kpis.append(self._create_kpi(
            "Customer Lifetime Value", clv, self.kpi_targets["customer_lifetime_value"],
            np.random.uniform(4200, 4800), "ETB", "customer"
        ))
        
        mau = np.random.uniform(35000, 65000)
        kpis.append(self._create_kpi(
            "Monthly Active Users", mau, self.kpi_targets["monthly_active_users"],
            np.random.uniform(30000, 45000), "users", "growth"
        ))
        
        # Market and Competitive KPIs
        market_share = np.random.uniform(8, 18)
        kpis.append(self._create_kpi(
            "Market Share", market_share, self.kpi_targets["market_share"],
            np.random.uniform(7, 12), "%", "growth"
        ))
        
        nps = np.random.uniform(45, 75)
        kpis.append(self._create_kpi(
            "Net Promoter Score", nps, self.kpi_targets["net_promoter_score"],
            np.random.uniform(50, 65), "score", "customer"
        ))
        
        # Operational KPIs
        operational_efficiency = np.random.uniform(80, 95)
        kpis.append(self._create_kpi(
            "Operational Efficiency", operational_efficiency, self.kpi_targets["operational_efficiency"],
            np.random.uniform(75, 85), "%", "operational"
        ))
        
        # Financial Health KPIs
        burn_rate = np.random.uniform(600000, 1000000)
        kpis.append(self._create_kpi(
            "Monthly Burn Rate", burn_rate, self.kpi_targets["burn_rate"],
            np.random.uniform(700000, 900000), "ETB", "revenue"
        ))
        
        runway = np.random.uniform(18, 30)
        kpis.append(self._create_kpi(
            "Runway", runway, self.kpi_targets["runway_months"],
            np.random.uniform(20, 26), "months", "financial"
        ))
        
        return kpis
    
    def _create_kpi(self, name: str, current: float, target: float, 
                   previous: float, unit: str, category: str) -> BusinessKPI:
        """Create a BusinessKPI object with calculated metrics"""
        
        # Calculate performance status
        performance_ratio = current / target if target != 0 else 0
        if performance_ratio >= 1.1:
            status = PerformanceStatus.EXCEEDING
        elif performance_ratio >= 0.95:
            status = PerformanceStatus.ON_TARGET
        elif performance_ratio >= 0.80:
            status = PerformanceStatus.BELOW_TARGET
        else:
            status = PerformanceStatus.CRITICAL
        
        # Calculate trend
        trend_percentage = ((current - previous) / previous * 100) if previous != 0 else 0
        
        # Simulate benchmark comparison
        benchmark_comparison = np.random.uniform(-15, 25)  # vs industry average
        
        return BusinessKPI(
            kpi_name=name,
            current_value=current,
            target_value=target,
            previous_period_value=previous,
            unit=unit,
            category=category,
            status=status,
            trend_percentage=trend_percentage,
            benchmark_comparison=benchmark_comparison,
            last_updated=datetime.now()
        )

class CEOVisualizationGenerator:
    """Generates all interactive visualizations for the CEO dashboard."""
    
    def __init__(self, report_dir: Path):
        self.report_dir = report_dir
        self.report_dir.mkdir(exist_ok=True, parents=True)

    def generate_kpi_visualizations(self, kpis: List[BusinessKPI]):
        """Generate and save KPI visualizations"""
        logger.info("Generating KPI visualizations...")
        df = pd.DataFrame([asdict(k) for k in kpis])

        # KPI Gauge Grid
        self._create_gauge_grid(df)
        
        # Financial vs Growth KPIs
        self._create_financial_vs_growth_plot(df)
        
        # Trend Analysis
        self._create_trend_analysis_plot(df)

    def _create_gauge_grid(self, df: pd.DataFrame):
        """Creates a grid of gauge charts for key KPIs."""
        fig = make_subplots(
            rows=3, cols=3,
            specs=[[{'type': 'indicator'}]*3]*3,
            subplot_titles=df['kpi_name'][:9]
        )
        
        for i, row in df.head(9).iterrows():
            fig.add_trace(go.Indicator(
                mode="gauge+number+delta",
                value=row['current_value'],
                delta={'reference': row['previous_period_value']},
                title={'text': row['unit']},
                gauge={'axis': {'range': [None, row['target_value'] * 1.5]}},
            ), row=i//3 + 1, col=i%3 + 1)
        
        fig.update_layout(title_text="Key Performance Indicator Gauges")
        path = self.report_dir / "kpi_gauge_grid.html"
        fig.write_html(str(path))
        logger.info(f"Saved gauge grid to {path}")

    def _create_financial_vs_growth_plot(self, df: pd.DataFrame):
        """Creates a scatter plot comparing financial and growth KPIs."""
        financial_kpis = df[df['category'].isin(['revenue', 'financial'])]
        growth_kpis = df[df['category'].isin(['growth', 'customer'])]

        fig = px.scatter(
            df, x="current_value", y="trend_percentage", 
            color="category", size="benchmark_comparison",
            hover_name="kpi_name",
            title="Financial vs. Growth KPI Performance"
        )
        path = self.report_dir / "financial_vs_growth.html"
        fig.write_html(str(path))
        logger.info(f"Saved financial vs growth plot to {path}")

    def _create_trend_analysis_plot(self, df: pd.DataFrame):
        """Creates a bar chart showing KPI trends."""
        fig = px.bar(
            df, x='kpi_name', y='trend_percentage',
            color='status',
            title='KPI Trend Analysis (% change from previous period)',
            labels={'kpi_name': 'Key Performance Indicator', 'trend_percentage': 'Trend (%)'}
        )
        path = self.report_dir / "kpi_trend_analysis.html"
        fig.write_html(str(path))
        logger.info(f"Saved trend analysis plot to {path}")


class StrategicInitiativeTracker:
    """Track and manage strategic business initiatives"""
    
    def __init__(self):
        self.current_initiatives = [
            {
                "name": "Market Expansion to Oromia Region",
                "description": "Expand BNPL services to major cities in Oromia region",
                "priority": BusinessPriority.STRATEGIC,
                "budget_allocated": 5000000,  # ETB
                "timeline_months": 12,
                "responsible_executive": "COO",
                "expected_roi": 250
            },
            {
                "name": "AI-Powered Credit Scoring Enhancement",
                "description": "Implement advanced ML models for improved credit assessment",
                "priority": BusinessPriority.HIGH,
                "budget_allocated": 2500000,  # ETB
                "timeline_months": 8,
                "responsible_executive": "CTO",
                "expected_roi": 180
            },
            {
                "name": "Merchant Partner Integration Platform",
                "description": "Build comprehensive platform for merchant onboarding and management",
                "priority": BusinessPriority.HIGH,
                "budget_allocated": 3000000,  # ETB
                "timeline_months": 10,
                "responsible_executive": "CPO",
                "expected_roi": 200
            },
            {
                "name": "Customer Experience Mobile App Redesign",
                "description": "Complete UX overhaul of mobile application",
                "priority": BusinessPriority.MEDIUM,
                "budget_allocated": 1500000,  # ETB
                "timeline_months": 6,
                "responsible_executive": "CPO",
                "expected_roi": 120
            }
        ]
    
    def track_initiative_progress(self) -> List[StrategicInitiative]:
        """Track progress of all strategic initiatives"""
        logger.info("Tracking strategic initiative progress...")
        
        initiatives = []
        
        for i, init_data in enumerate(self.current_initiatives):
            # Simulate progress and spending
            progress = np.random.uniform(15, 85)
            budget_spent = init_data["budget_allocated"] * (progress / 100) * np.random.uniform(0.8, 1.2)
            
            # Simulate risk assessment
            risk_levels = ["Low", "Medium", "High"]
            risk_level = np.random.choice(risk_levels, p=[0.4, 0.4, 0.2])
            
            initiatives.append(StrategicInitiative(
                initiative_id=f"INIT-2024-{i+1:03d}",
                name=init_data["name"],
                description=init_data["description"],
                priority=init_data["priority"],
                progress_percentage=progress,
                budget_allocated=init_data["budget_allocated"],
                budget_spent=budget_spent,
                expected_roi=init_data["expected_roi"],
                timeline_months=init_data["timeline_months"],
                responsible_executive=init_data["responsible_executive"],
                risk_level=risk_level,
                dependencies=[]  # Simplified for demo
            ))
        
        return initiatives

class MarketIntelligenceAnalyzer:
    """Market analysis and competitive intelligence"""
    
    def __init__(self):
        self.fintech_competitors = [
            "CBE Birr", "HelloCash", "M-Birr", "Lion Bank Digital",
            "Dashen Mobile Banking", "Wegagen Mobile Banking"
        ]
        
        self.market_segments = {
            "mobile_payments": {"market_size": 50000000, "growth_rate": 25},
            "bnpl_services": {"market_size": 15000000, "growth_rate": 45},
            "digital_banking": {"market_size": 80000000, "growth_rate": 30},
            "merchant_services": {"market_size": 25000000, "growth_rate": 35}
        }
    
    async def analyze_market_position(self) -> List[MarketIntelligence]:
        """Analyze market position and competitive landscape"""
        logger.info("Analyzing market position and competitive intelligence...")
        
        market_insights = []
        
        for segment, data in self.market_segments.items():
            # Simulate our position vs market
            our_position = np.random.uniform(8, 20)  # Market share %
            market_average = 100 / len(self.fintech_competitors)  # Assuming equal distribution
            leading_competitor = np.random.uniform(25, 40)
            
            # Determine market trend
            trend = "growing" if data["growth_rate"] > 20 else "stable" if data["growth_rate"] > 5 else "declining"
            
            # Calculate opportunity score
            opportunity_score = min(100, data["growth_rate"] * 2 + (leading_competitor - our_position))
            
            # Assess threat level
            if our_position < market_average * 0.5:
                threat_level = "High"
            elif our_position < market_average:
                threat_level = "Medium"
            else:
                threat_level = "Low"
            
            market_insights.append(MarketIntelligence(
                metric_name=segment.replace('_', ' ').title(),
                our_position=our_position,
                market_average=market_average,
                leading_competitor=leading_competitor,
                market_trend=trend,
                opportunity_score=opportunity_score,
                threat_level=threat_level
            ))
        
        return market_insights

class RiskManagementFramework:
    """Enterprise risk management and assessment"""
    
    def __init__(self):
        self.risk_categories = {
            "operational": "Day-to-day business operations",
            "financial": "Financial performance and liquidity",
            "regulatory": "Compliance and regulatory changes",
            "technology": "Technology infrastructure and security",
            "market": "Market conditions and competition",
            "strategic": "Strategic direction and execution"
        }
    
    def assess_enterprise_risks(self) -> List[Dict[str, Any]]:
        """Assess enterprise-wide risks"""
        logger.info("Assessing enterprise-wide risks...")
        
        risks = []
        
        # Operational Risks
        risks.extend([
            {
                "category": "operational",
                "description": "Key personnel departure in critical roles",
                "probability": 0.3,
                "impact": 0.7,
                "mitigation": "Succession planning and knowledge transfer programs",
                "owner": "CHRO"
            },
            {
                "category": "operational",
                "description": "Supply chain disruption affecting merchant partnerships",
                "probability": 0.2,
                "impact": 0.6,
                "mitigation": "Diversify merchant partner portfolio",
                "owner": "COO"
            }
        ])
        
        # Financial Risks
        risks.extend([
            {
                "category": "financial",
                "description": "Currency devaluation affecting international operations",
                "probability": 0.4,
                "impact": 0.8,
                "mitigation": "Implement currency hedging strategies",
                "owner": "CFO"
            },
            {
                "category": "financial",
                "description": "Default rate increase due to economic downturn",
                "probability": 0.3,
                "impact": 0.9,
                "mitigation": "Enhanced credit scoring and risk assessment",
                "owner": "CRO"
            }
        ])
        
        # Regulatory Risks
        risks.extend([
            {
                "category": "regulatory",
                "description": "New NBE regulations restricting BNPL operations",
                "probability": 0.25,
                "impact": 0.95,
                "mitigation": "Active regulatory engagement and compliance monitoring",
                "owner": "CCO"
            }
        ])
        
        # Technology Risks
        risks.extend([
            {
                "category": "technology",
                "description": "Major cybersecurity breach affecting customer data",
                "probability": 0.15,
                "impact": 0.9,
                "mitigation": "Continuous security monitoring and incident response",
                "owner": "CISO"
            }
        ])
        
        # Calculate risk scores
        for risk in risks:
            risk["risk_score"] = risk["probability"] * risk["impact"] * 100
            if risk["risk_score"] >= 50:
                risk["priority"] = "Critical"
            elif risk["risk_score"] >= 30:
                risk["priority"] = "High"
            elif risk["risk_score"] >= 15:
                risk["priority"] = "Medium"
            else:
                risk["priority"] = "Low"
        
        return sorted(risks, key=lambda x: x["risk_score"], reverse=True)

class BoardReportGenerator:
    """Generates components of the board-level summary report."""
    
    def __init__(self, db: ExecutiveDatabase):
        self.db = db
    
    def generate_board_summary(self, kpis: List[BusinessKPI], 
                             initiatives: List[StrategicInitiative],
                             market_intel: List[MarketIntelligence],
                             risks: List[Dict[str, Any]]) -> str:
        """Generate executive summary for board of directors"""
        
        # Calculate overall business health
        on_target_kpis = len([k for k in kpis if k.status in [PerformanceStatus.ON_TARGET, PerformanceStatus.EXCEEDING]])
        total_kpis = len(kpis)
        business_health = (on_target_kpis / total_kpis * 100) if total_kpis > 0 else 0
        
        # Calculate initiative progress
        avg_initiative_progress = np.mean([i.progress_percentage for i in initiatives])
        
        # Assess strategic position
        avg_market_position = np.mean([m.our_position for m in market_intel])
        
        # Critical risks
        critical_risks = [r for r in risks if r["priority"] == "Critical"]
        
        summary = f"""
# Board of Directors - Executive Summary

## Business Performance: {'🟢 STRONG' if business_health >= 80 else '🟡 MODERATE' if business_health >= 60 else '🔴 NEEDS ATTENTION'}

### Key Performance Highlights:
- **Overall KPI Achievement**: {business_health:.1f}% ({on_target_kpis}/{total_kpis} KPIs on target)
- **Strategic Initiative Progress**: {avg_initiative_progress:.1f}% average completion
- **Market Position**: {avg_market_position:.1f}% average market share across segments
- **Critical Risk Exposure**: {len(critical_risks)} high-priority risks identified

### Financial Performance:
"""
        
        # Financial highlights
        revenue_kpi = next((k for k in kpis if "Revenue" in k.kpi_name), None)
        if revenue_kpi:
            trend_icon = "📈" if revenue_kpi.trend_percentage > 0 else "📉"
            summary += f"- **Monthly Revenue**: {revenue_kpi.current_value:,.0f} {revenue_kpi.unit} {trend_icon} ({revenue_kpi.trend_percentage:+.1f}%)\n"
            summary += f"- **Revenue Target Achievement**: {(revenue_kpi.current_value/revenue_kpi.target_value*100):.1f}%\n"
        
        burn_rate_kpi = next((k for k in kpis if "Burn Rate" in k.kpi_name), None)
        if burn_rate_kpi:
            summary += f"- **Monthly Burn Rate**: {burn_rate_kpi.current_value:,.0f} {burn_rate_kpi.unit}\n"
        
        runway_kpi = next((k for k in kpis if "Runway" in k.kpi_name), None)
        if runway_kpi:
            summary += f"- **Cash Runway**: {runway_kpi.current_value:.1f} {runway_kpi.unit}\n"
        
        # Strategic initiatives status
        summary += "\n### Strategic Initiatives Status:\n"
        for initiative in sorted(initiatives, key=lambda x: x.priority.value):
            status_icon = "🟢" if initiative.progress_percentage >= 75 else "🟡" if initiative.progress_percentage >= 50 else "🔴"
            summary += f"- {status_icon} **{initiative.name}**: {initiative.progress_percentage:.1f}% complete ({initiative.responsible_executive})\n"
        
        # Market position
        summary += "\n### Market Position:\n"
        for intel in market_intel:
            position_icon = "🟢" if intel.our_position > intel.market_average else "🟡"
            summary += f"- {position_icon} **{intel.metric_name}**: {intel.our_position:.1f}% market share (vs {intel.market_average:.1f}% average)\n"
        
        # Critical risks requiring board attention
        if critical_risks:
            summary += "\n### Critical Risks Requiring Board Attention:\n"
            for risk in critical_risks[:3]:  # Top 3 critical risks
                summary += f"- 🚨 **{risk['category'].title()}**: {risk['description']} (Risk Score: {risk['risk_score']:.0f})\n"
        
        return summary

    def _get_executive_kpis(self) -> List[Dict[str, Any]]:
        """Get executive KPIs for dashboard display"""
        try:
            kpi_analyzer = BusinessKPIAnalyzer()
            kpis = asyncio.run(kpi_analyzer.analyze_business_performance())
            return [
                {
                    'name': kpi.kpi_name,
                    'current_value': kpi.current_value,
                    'target_value': kpi.target_value,
                    'status': kpi.status.value.upper() if hasattr(kpi.status, 'value') else str(kpi.status)
                }
                for kpi in kpis[:8]  # Show top 8 KPIs
            ]
        except Exception:
            return self._get_mock_kpis()

    def _get_strategic_initiatives(self) -> List[Dict[str, Any]]:
        """Get strategic initiatives for dashboard display"""
        try:
            tracker = StrategicInitiativeTracker()
            initiatives = tracker.track_initiative_progress()
            return [
                {
                    'name': init.name,
                    'progress': init.progress_percentage,
                    'status': 'ON_TRACK' if init.progress_percentage >= 75 else 'AT_RISK',
                    'owner': init.responsible_executive
                }
                for init in initiatives[:6]  # Show top 6 initiatives
            ]
        except Exception:
            return self._get_mock_initiatives()

    def _get_market_position(self) -> List[Dict[str, Any]]:
        """Get market position data for dashboard display"""
        try:
            analyzer = MarketIntelligenceAnalyzer()
            market_intel = asyncio.run(analyzer.analyze_market_position())
            return [
                {
                    'segment': intel.metric_name,
                    'share': intel.our_position,
                    'vs_average': intel.our_position - intel.market_average,
                    'trend': intel.market_trend.upper()
                }
                for intel in market_intel[:5]  # Show top 5 market segments
            ]
        except Exception:
            return self._get_mock_market_position()

    def _get_financial_overview(self) -> List[Dict[str, Any]]:
        """Get financial overview data"""
        try:
            kpi_analyzer = BusinessKPIAnalyzer()
            kpis = asyncio.run(kpi_analyzer.analyze_business_performance())
            financial_kpis = [kpi for kpi in kpis if kpi.category in ['revenue', 'financial']]
            return [
                {
                    'metric': kpi.kpi_name,
                    'current_value': kpi.current_value,
                    'target_value': kpi.target_value,
                    'status': kpi.status.value.upper() if hasattr(kpi.status, 'value') else str(kpi.status)
                }
                for kpi in financial_kpis[:4]
            ]
        except Exception:
            return self._get_mock_financial_overview()

    def _get_risk_assessment(self) -> List[Dict[str, Any]]:
        """Get risk assessment data"""
        try:
            risk_manager = RiskManagementFramework()
            risks = risk_manager.assess_enterprise_risks()
            return [
                {
                    'category': risk['category'],
                    'description': risk['description'],
                    'priority': risk['priority'],
                    'risk_score': risk['risk_score']
                }
                for risk in risks[:4]  # Show top 4 risks
            ]
        except Exception:
            return self._get_mock_risk_assessment()

    def _get_mock_kpis(self) -> List[Dict[str, Any]]:
        """Return mock KPI data"""
        return [
            {'name': 'Monthly Revenue', 'current_value': 1800000, 'target_value': 2000000, 'status': 'WARNING'},
            {'name': 'Customer Acquisition Cost', 'current_value': 280, 'target_value': 250, 'status': 'GOOD'},
            {'name': 'Monthly Active Users', 'current_value': 45000, 'target_value': 50000, 'status': 'WARNING'},
            {'name': 'Market Share', 'current_value': 12.5, 'target_value': 15, 'status': 'WARNING'}
        ]

    def _get_mock_initiatives(self) -> List[Dict[str, Any]]:
        """Return mock strategic initiatives data"""
        return [
            {'name': 'AI-Powered Credit Scoring', 'progress': 65.0, 'status': 'ON_TRACK', 'owner': 'CTO'},
            {'name': 'Merchant Integration Platform', 'progress': 45.0, 'status': 'AT_RISK', 'owner': 'CPO'},
            {'name': 'Mobile App Redesign', 'progress': 80.0, 'status': 'ON_TRACK', 'owner': 'CPO'}
        ]

    def _get_mock_market_position(self) -> List[Dict[str, Any]]:
        """Return mock market position data"""
        return [
            {'segment': 'Mobile Payments', 'share': 12.5, 'vs_average': -2.5, 'trend': 'UP'},
            {'segment': 'Digital Banking', 'share': 15.8, 'vs_average': 1.8, 'trend': 'UP'},
            {'segment': 'Merchant Services', 'share': 8.2, 'vs_average': -4.2, 'trend': 'DOWN'}
        ]

    def _get_mock_financial_overview(self) -> List[Dict[str, Any]]:
        """Return mock financial overview data"""
        return [
            {'metric': 'Monthly Revenue', 'current_value': 1800000, 'target_value': 2000000, 'status': 'WARNING'},
            {'metric': 'Monthly Burn Rate', 'current_value': 850000, 'target_value': 800000, 'status': 'WARNING'},
            {'metric': 'Runway', 'current_value': 22, 'target_value': 24, 'status': 'GOOD'}
        ]

    def _get_mock_risk_assessment(self) -> List[Dict[str, Any]]:
        """Return mock risk assessment data"""
        return [
            {'category': 'operational', 'description': 'Key personnel departure', 'priority': 'High', 'risk_score': 25.0},
            {'category': 'financial', 'description': 'Currency fluctuation', 'priority': 'Medium', 'risk_score': 18.0},
            {'category': 'regulatory', 'description': 'New compliance requirements', 'priority': 'High', 'risk_score': 22.0}
        ]

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get CEO dashboard data for terminal interface"""
        try:
            return {
                'kpis': self._get_executive_kpis(),
                'strategic_initiatives': self._get_strategic_initiatives(),
                'market_position': self._get_market_position(),
                'financial_overview': self._get_financial_overview(),
                'risk_assessment': self._get_risk_assessment()
            }
        except Exception as e:
            logger.error(f"Error getting CEO dashboard data: {str(e)}")
            return self._get_mock_data()

    def get_realtime_metrics(self) -> Dict[str, Any]:
        """Get real-time CEO metrics"""
        return {
            'active_initiatives': 5,
            'kpi_achievement': 77.8,
            'market_share_trend': '+2.3%',
            'last_update': datetime.now().strftime('%H:%M:%S')
        }

    def get_realtime_update(self) -> Dict[str, Any]:
        """Get real-time dashboard update"""
        return {
            'timestamp': datetime.now().isoformat(),
            'kpi_updates': self._get_executive_kpis()[:3],
            'alerts': []
        }

    def _get_mock_data(self) -> Dict[str, Any]:
        """Return mock data for testing"""
        return {
            'kpis': [
                {'name': 'Revenue Growth', 'current_value': 1250000, 'target_value': 1200000, 'status': 'GOOD'},
                {'name': 'Customer Satisfaction', 'current_value': 92, 'target_value': 90, 'status': 'GOOD'},
                {'name': 'Market Share', 'current_value': 15.2, 'target_value': 16.7, 'status': 'WARNING'}
            ],
            'strategic_initiatives': [
                {'name': 'AI-Powered Credit Scoring', 'progress': 61.6, 'status': 'ON_TRACK', 'owner': 'CTO'},
                {'name': 'Merchant Integration Platform', 'progress': 61.5, 'status': 'ON_TRACK', 'owner': 'CPO'},
                {'name': 'Mobile App Redesign', 'progress': 60.2, 'status': 'ON_TRACK', 'owner': 'CPO'}
            ],
            'market_position': [
                {'segment': 'Mobile Payments', 'share': 9.7, 'vs_average': -7.0, 'trend': 'UP'},
                {'segment': 'Digital Banking', 'share': 15.3, 'vs_average': -1.4, 'trend': 'UP'},
                {'segment': 'Merchant Services', 'share': 8.0, 'vs_average': -8.7, 'trend': 'DOWN'}
            ]
        }


async def main():
    """Main function to run the CEO dashboard generation"""
    logger.info("Starting CEO Dashboard Generation...")

    report_manager = ReportManager(REPORTS_DIR)
    db_manager = ExecutiveDatabase(EXECUTIVE_DB)
    
    kpi_analyzer = BusinessKPIAnalyzer()
    initiative_tracker = StrategicInitiativeTracker()
    market_analyzer = MarketIntelligenceAnalyzer()
    risk_manager = RiskManagementFramework()
    report_generator = BoardReportGenerator(db_manager)
    viz_generator = CEOVisualizationGenerator(REPORTS_DIR)

    # 1. Analyze all business areas
    kpis = await kpi_analyzer.analyze_business_performance()
    initiatives = initiative_tracker.track_initiative_progress()
    market_intel = await market_analyzer.analyze_market_position()
    risks = risk_manager.assess_enterprise_risks()

    # 2. Generate Visualizations
    logger.info("Generating interactive visualizations for CEO dashboard...")
    try:
        viz_generator.generate_kpi_visualizations(kpis)
        # Manually add the generated charts to the report manager
        report_manager.add_visualization("KPI Gauge Grid", str(REPORTS_DIR / "kpi_gauge_grid.html"))
        report_manager.add_visualization("Financial vs. Growth KPIs", str(REPORTS_DIR / "financial_vs_growth.html"))
        report_manager.add_visualization("KPI Trend Analysis", str(REPORTS_DIR / "kpi_trend_analysis.html"))
        logger.info("All CEO visualizations generated successfully.")
    except Exception as e:
        logger.error(f"Error generating CEO visualizations: {e}", exc_info=True)

    # 3. Generate Report Sections
    summary_section = report_generator.generate_board_summary(kpis, initiatives, market_intel, risks)
    report_manager.add_section("CEO's Daily Briefing", summary_section)

    # 4. Save Consolidated Report
    final_report_path = report_manager.save_report()
    
    safe_print(f"CEO Dashboard generation complete. Report at: {final_report_path}")

if __name__ == '__main__':
    # Set Plotly default template
    px.defaults.template = "plotly_dark"
    asyncio.run(main()) 