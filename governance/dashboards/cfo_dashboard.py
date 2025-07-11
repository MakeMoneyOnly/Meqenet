#!/usr/bin/env python3
"""
Enhanced CFO (Chief Financial Officer) Dashboard for Meqenet.et
Enterprise-Grade Fintech Financial Management & FinOps System

Features:
- Real-time cloud cost analytics and optimization
- AI-powered budget forecasting and variance analysis
- Automated FinOps recommendations
- Revenue analytics and business metrics
- Cost allocation and chargeback management
- Financial risk assessment
- Executive-level financial reporting
- Interactive financial visualizations with Plotly

Author: Meqenet.et Governance Team
"""

import json
import sqlite3
import pandas as pd
import numpy as np
import boto3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from functools import lru_cache
import asyncio
import aiohttp
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.io as pio
import warnings
warnings.filterwarnings('ignore')

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
REPORTS_DIR = PROJECT_ROOT / "governance" / "reports" / "dashboards" / "cfo"
FINOPS_DB = Path(__file__).parent / "finops.db"
REPORTS_DIR.mkdir(exist_ok=True, parents=True)

class ReportManager:
    """Manages the creation and consolidation of the CFO report."""
    def __init__(self, report_dir: Path):
        self.report_dir = report_dir
        self.report_content = []
        self.visualization_paths = {}
        self.timestamp = datetime.now().strftime("%Y-%m-%d")
        self.report_path = self.report_dir / f"cfo_financial_summary_{self.timestamp}.md"

    def add_section(self, title: str, content: str):
        """Adds a text section to the report."""
        self.report_content.append(f"## {title}\n\n{content}\n\n")

    def add_visualization(self, title: str, file_path: str):
        """Adds a link to a visualization in the report."""
        if file_path:
            self.visualization_paths[title] = file_path
            self.report_content.append(f"## {title}\n\n[Interactive {title} Chart]({Path(file_path).name})\n\n")

    def save_report(self):
        """Saves the consolidated report to a single file."""
        final_report = f"# CFO Financial Summary - {self.timestamp}\n\n"
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
        logger.info(f"Consolidated CFO report saved to {self.report_path}")
        return str(self.report_path)

class CostCategory(Enum):
    COMPUTE = "compute"
    STORAGE = "storage"
    DATABASE = "database"
    NETWORKING = "networking"
    SECURITY = "security"
    MONITORING = "monitoring"
    ML_AI = "ml_ai"
    THIRD_PARTY = "third_party"

class OptimizationPriority(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class CostMetric:
    """Financial cost metrics"""
    service_name: str
    category: CostCategory
    current_cost: float
    projected_cost: float
    budget_allocation: float
    variance: float
    optimization_potential: float
    last_updated: datetime

@dataclass
class FinOpsRecommendation:
    """FinOps optimization recommendations"""
    recommendation_id: str
    service: str
    category: CostCategory
    priority: OptimizationPriority
    description: str
    potential_savings: float
    implementation_effort: str
    timeline: str
    risk_level: str
    auto_implementable: bool

@dataclass
class RevenueMetric:
    """Business revenue metrics"""
    metric_name: str
    current_value: float
    target_value: float
    growth_rate: float
    forecasted_value: float
    confidence_interval: Tuple[float, float]

class FinOpsDatabase:
    """Database manager for financial operations tracking"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize FinOps tracking database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cost_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_name TEXT NOT NULL,
                category TEXT NOT NULL,
                cost_amount REAL NOT NULL,
                budget_allocation REAL,
                variance REAL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS finops_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recommendation_id TEXT UNIQUE NOT NULL,
                service TEXT NOT NULL,
                priority TEXT NOT NULL,
                description TEXT NOT NULL,
                potential_savings REAL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                implemented_at TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS budget_forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                forecast_period TEXT NOT NULL,
                service_category TEXT NOT NULL,
                predicted_cost REAL NOT NULL,
                confidence_level REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def store_cost_metrics(self, metrics: List[CostMetric]):
        """Store cost metrics in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for metric in metrics:
            cursor.execute('''
                INSERT INTO cost_metrics 
                (service_name, category, cost_amount, budget_allocation, variance, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                metric.service_name,
                metric.category.value,
                metric.current_cost,
                metric.budget_allocation,
                metric.variance,
                json.dumps(asdict(metric), default=lambda obj: obj.value if hasattr(obj, 'value') else str(obj))
            ))
        
        conn.commit()
        conn.close()

class CloudCostAnalyzer:
    """Advanced cloud cost analysis and optimization"""
    
    def __init__(self):
        self.aws_client = None  # In production, initialize with actual AWS credentials
        self.cost_categories = {
            'auth-service': {'priority': 'high', 'budget_multiplier': 1.2},
            'payments-service': {'priority': 'critical', 'budget_multiplier': 1.5},
            'marketplace-service': {'priority': 'high', 'budget_multiplier': 1.3},
            'rewards-service': {'priority': 'medium', 'budget_multiplier': 1.1},
            'analytics-service': {'priority': 'medium', 'budget_multiplier': 1.0},
            'shared-infrastructure': {'priority': 'high', 'budget_multiplier': 1.4}
        }
    
    async def fetch_real_time_costs(self) -> List[CostMetric]:
        """Fetch real-time cost data from cloud providers"""
        logger.info("Fetching real-time cloud costs...")
        
        # Simulate fetching costs from AWS Cost Explorer API
        cost_metrics = []
        
        for service, config in self.cost_categories.items():
            # Simulate realistic cost data
            base_cost = np.random.uniform(800, 3000) * config['budget_multiplier']
            
            compute_cost = base_cost * np.random.uniform(0.35, 0.55)
            storage_cost = base_cost * np.random.uniform(0.15, 0.25)
            database_cost = base_cost * np.random.uniform(0.20, 0.35)
            networking_cost = base_cost * np.random.uniform(0.05, 0.15)
            
            for category_name, cost in [
                ('compute', compute_cost),
                ('storage', storage_cost),
                ('database', database_cost),
                ('networking', networking_cost)
            ]:
                budget_allocation = cost * np.random.uniform(1.1, 1.4)
                variance = ((cost - budget_allocation) / budget_allocation) * 100
                
                cost_metrics.append(CostMetric(
                    service_name=f"{service}-{category_name}",
                    category=CostCategory(category_name),
                    current_cost=round(cost, 2),
                    projected_cost=round(cost * np.random.uniform(1.05, 1.2), 2),
                    budget_allocation=round(budget_allocation, 2),
                    variance=round(variance, 2),
                    optimization_potential=round(cost * np.random.uniform(0.1, 0.3), 2),
                    last_updated=datetime.now()
                ))
        
        return cost_metrics
    
    def analyze_cost_trends(self, metrics: List[CostMetric]) -> Dict[str, Any]:
        """Analyze cost trends and patterns"""
        logger.info("Analyzing cost trends...")
        
        total_cost = sum(m.current_cost for m in metrics)
        total_budget = sum(m.budget_allocation for m in metrics)
        total_optimization_potential = sum(m.optimization_potential for m in metrics)
        
        over_budget_services = [m for m in metrics if m.variance > 0]
        under_budget_services = [m for m in metrics if m.variance < 0]
        
        # Calculate cost by category
        category_costs = {}
        for metric in metrics:
            category = metric.category.value
            if category not in category_costs:
                category_costs[category] = 0
            category_costs[category] += metric.current_cost
        
        return {
            'total_cost': total_cost,
            'total_budget': total_budget,
            'budget_variance': ((total_cost - total_budget) / total_budget) * 100,
            'optimization_potential': total_optimization_potential,
            'over_budget_count': len(over_budget_services),
            'under_budget_count': len(under_budget_services),
            'category_breakdown': category_costs,
            'trend_direction': 'increasing' if total_cost > total_budget else 'stable'
        }

class FinOpsOptimizer:
    """AI-powered FinOps optimization engine"""
    
    def __init__(self):
        self.optimization_rules = {
            'high_networking_costs': {
                'threshold': 0.15,  # 15% of total cost
                'recommendation': 'Consider implementing CDN or optimizing data transfer'
            },
            'oversized_compute': {
                'threshold': 0.6,  # 60% utilization
                'recommendation': 'Right-size compute instances based on actual usage'
            },
            'unused_storage': {
                'threshold': 0.3,  # 30% utilization
                'recommendation': 'Implement lifecycle policies for aged data'
            }
        }
    
    def generate_recommendations(self, metrics: List[CostMetric]) -> List[FinOpsRecommendation]:
        """Generate AI-powered FinOps recommendations"""
        logger.info("Generating FinOps optimization recommendations...")
        
        recommendations = []
        
        # Analyze each service for optimization opportunities
        service_groups = {}
        for metric in metrics:
            service_base = metric.service_name.split('-')[0]
            if service_base not in service_groups:
                service_groups[service_base] = []
            service_groups[service_base].append(metric)
        
        for service, service_metrics in service_groups.items():
            total_service_cost = sum(m.current_cost for m in service_metrics)
            
            # Check for high networking costs
            networking_metrics = [m for m in service_metrics if m.category == CostCategory.NETWORKING]
            if networking_metrics:
                networking_cost = sum(m.current_cost for m in networking_metrics)
                if networking_cost / total_service_cost > self.optimization_rules['high_networking_costs']['threshold']:
                    recommendations.append(FinOpsRecommendation(
                        recommendation_id=f"NET-{service}-{datetime.now().strftime('%Y%m%d')}",
                        service=service,
                        category=CostCategory.NETWORKING,
                        priority=OptimizationPriority.HIGH,
                        description=f"High networking costs detected in {service} ({networking_cost:.2f} ETB)",
                        potential_savings=networking_cost * 0.3,
                        implementation_effort="Medium",
                        timeline="2-4 weeks",
                        risk_level="Low",
                        auto_implementable=False
                    ))
            
            # Check for oversized compute
            compute_metrics = [m for m in service_metrics if m.category == CostCategory.COMPUTE]
            if compute_metrics:
                compute_cost = sum(m.current_cost for m in compute_metrics)
                if compute_cost > total_service_cost * 0.5:  # More than 50% of service cost
                    recommendations.append(FinOpsRecommendation(
                        recommendation_id=f"CMP-{service}-{datetime.now().strftime('%Y%m%d')}",
                        service=service,
                        category=CostCategory.COMPUTE,
                        priority=OptimizationPriority.MEDIUM,
                        description=f"Compute costs may be oversized in {service}",
                        potential_savings=compute_cost * 0.2,
                        implementation_effort="High",
                        timeline="4-6 weeks",
                        risk_level="Medium",
                        auto_implementable=True
                    ))
        
        # Add strategic recommendations
        recommendations.append(FinOpsRecommendation(
            recommendation_id=f"STR-RESERVED-{datetime.now().strftime('%Y%m%d')}",
            service="all-services",
            category=CostCategory.COMPUTE,
            priority=OptimizationPriority.HIGH,
            description="Consider Reserved Instances for predictable workloads",
            potential_savings=sum(m.current_cost for m in metrics if m.category == CostCategory.COMPUTE) * 0.3,
            implementation_effort="Low",
            timeline="1-2 weeks",
            risk_level="Very Low",
            auto_implementable=False
        ))
        
        return recommendations

class BudgetForecaster:
    """AI-powered budget forecasting system"""
    
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
    
    def forecast_costs(self, historical_data: List[CostMetric], 
                      forecast_periods: int = 12) -> Dict[str, Any]:
        """Generate budget forecasts using machine learning"""
        logger.info("Generating budget forecasts...")
        
        # Simulate historical data for ML training
        dates = pd.date_range(start=datetime.now() - timedelta(days=365), 
                             end=datetime.now(), freq='D')
        
        forecasts = {}
        
        for category in CostCategory:
            # Generate synthetic historical data
            np.random.seed(42)  # For reproducible results
            base_cost = np.random.uniform(500, 2000)
            trend = np.random.uniform(0.02, 0.05)  # 2-5% monthly growth
            
            historical_costs = []
            for i, date in enumerate(dates):
                # Add trend, seasonality, and noise
                seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * i / 30)  # Monthly seasonality
                noise = np.random.normal(0, 0.05)  # 5% noise
                cost = base_cost * (1 + trend * i / 30) * seasonal_factor * (1 + noise)
                historical_costs.append(cost)
            
            # Prepare data for ML model
            X = np.array(range(len(historical_costs))).reshape(-1, 1)
            y = np.array(historical_costs)
            
            # Train model
            X_scaled = self.scaler.fit_transform(X)
            self.model.fit(X_scaled, y)
            
            # Generate forecasts
            future_X = np.array(range(len(historical_costs), 
                                    len(historical_costs) + forecast_periods)).reshape(-1, 1)
            future_X_scaled = self.scaler.transform(future_X)
            predictions = self.model.predict(future_X_scaled)
            
            # Calculate confidence intervals
            prediction_std = np.std(y - self.model.predict(X_scaled))
            confidence_intervals = [(pred - 1.96 * prediction_std, pred + 1.96 * prediction_std) 
                                  for pred in predictions]
            
            forecasts[category.value] = {
                'predictions': predictions.tolist(),
                'confidence_intervals': confidence_intervals,
                'monthly_growth_rate': trend * 100,
                'forecast_accuracy': 0.85 + np.random.uniform(-0.1, 0.1)  # 85% +/- 10%
            }
        
        return forecasts

class RevenueAnalyzer:
    """Business revenue and growth analytics"""
    
    def __init__(self):
        self.revenue_streams = {
            'merchant_fees': {'rate': 0.025, 'base_volume': 100000},
            'consumer_interest': {'rate': 0.18, 'base_volume': 50000},
            'premium_subscriptions': {'rate': 49.99, 'base_subscribers': 1000},
            'marketplace_commissions': {'rate': 0.05, 'base_volume': 75000}
        }
    
    def analyze_revenue_metrics(self) -> List[RevenueMetric]:
        """Analyze current revenue performance"""
        logger.info("Analyzing revenue metrics...")
        
        revenue_metrics = []
        
        for stream, config in self.revenue_streams.items():
            # Simulate current performance with some variance
            base_value = config['rate'] * config.get('base_volume', config.get('base_subscribers', 1))
            current_value = base_value * np.random.uniform(0.8, 1.2)
            target_value = base_value * 1.5  # 50% growth target
            
            # Calculate growth rate (monthly)
            growth_rate = np.random.uniform(0.05, 0.15)  # 5-15% monthly growth
            
            # Forecast future value
            forecasted_value = current_value * (1 + growth_rate) ** 12  # 12 months ahead
            
            # Confidence interval
            confidence_lower = forecasted_value * 0.8
            confidence_upper = forecasted_value * 1.2
            
            revenue_metrics.append(RevenueMetric(
                metric_name=stream.replace('_', ' ').title(),
                current_value=round(current_value, 2),
                target_value=round(target_value, 2),
                growth_rate=round(growth_rate * 100, 2),
                forecasted_value=round(forecasted_value, 2),
                confidence_interval=(round(confidence_lower, 2), round(confidence_upper, 2))
            ))
        
        return revenue_metrics

class FinancialVisualizationGenerator:
    """Generate interactive financial visualizations"""
    
    def __init__(self, report_dir: Path):
        self.report_dir = report_dir

    def create_financial_health_gauge(self, revenue: float, cost: float) -> str:
        """Create a financial health gauge chart"""
        
        profit_margin = ((revenue - cost) / revenue * 100) if revenue > 0 else 0
        
        fig = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=profit_margin,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Profit Margin (%)"},
            delta={'reference': 15},
            gauge={
                'axis': {'range': [-5, 30]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [-5, 0], 'color': "red"},
                    {'range': [0, 10], 'color': "orange"},
                    {'range': [10, 20], 'color': "yellow"},
                    {'range': [20, 30], 'color': "green"}
                ],
                'threshold': {
                    'line': {'color': "black", 'width': 4},
                    'thickness': 0.75,
                    'value': 15
                }
            }
        ))
        
        fig.update_layout(
            height=300,
            margin=dict(l=10, r=10, t=50, b=10),
            title="Financial Health Gauge"
        )
        
        # Save the chart
        chart_path = self.report_dir / "financial_health_gauge.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_revenue_breakdown(self, revenue_metrics: List[RevenueMetric]) -> str:
        """Create a revenue breakdown visualization"""
        
        # Prepare data
        labels = [m.metric_name for m in revenue_metrics]
        values = [m.current_value for m in revenue_metrics]
        targets = [m.target_value for m in revenue_metrics]
        
        # Create subplots with 2 charts
        fig = make_subplots(
            rows=1, cols=2,
            specs=[[{"type": "pie"}, {"type": "bar"}]],
            subplot_titles=("Revenue Distribution", "Revenue vs Target")
        )
        
        # Add pie chart
        fig.add_trace(
            go.Pie(
                labels=labels,
                values=values,
                hole=.4,
                textinfo='label+percent',
                marker_colors=px.colors.qualitative.Plotly
            ),
            row=1, col=1
        )
        
        # Add bar chart comparing current to target
        fig.add_trace(
            go.Bar(
                x=labels,
                y=values,
                name="Current Revenue",
                marker_color='rgb(26, 118, 255)'
            ),
            row=1, col=2
        )
        
        fig.add_trace(
            go.Bar(
                x=labels,
                y=targets,
                name="Target Revenue",
                marker_color='rgba(58, 71, 80, 0.6)'
            ),
            row=1, col=2
        )
        
        fig.update_layout(
            height=500,
            title_text="Revenue Analysis",
            barmode='group'
        )
        
        # Save the chart
        chart_path = self.report_dir / "revenue_breakdown.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_cost_analysis(self, cost_metrics: List[CostMetric], cost_analysis: Dict[str, Any]) -> str:
        """Create cost analysis visualization"""
        
        # Prepare category data
        categories = list(cost_analysis['category_breakdown'].keys())
        category_costs = list(cost_analysis['category_breakdown'].values())
        
        # Create treemap for cost breakdown
        fig1 = px.treemap(
            names=categories,
            parents=[""] * len(categories),
            values=category_costs,
            color=category_costs,
            color_continuous_scale='RdBu_r',
            title="Cost Breakdown by Category"
        )
        
        # Save the treemap
        treemap_path = self.report_dir / "cost_treemap.html"
        fig1.write_html(str(treemap_path))
        
        # Create budget variance chart
        services = []
        current_costs = []
        budget_allocations = []
        variances = []
        
        for metric in cost_metrics:
            services.append(metric.service_name)
            current_costs.append(metric.current_cost)
            budget_allocations.append(metric.budget_allocation)
            variances.append(metric.variance)
        
        # Sort by variance (descending)
        sorted_indices = sorted(range(len(variances)), key=lambda i: variances[i], reverse=True)
        services = [services[i] for i in sorted_indices]
        current_costs = [current_costs[i] for i in sorted_indices]
        budget_allocations = [budget_allocations[i] for i in sorted_indices]
        variances = [variances[i] for i in sorted_indices]
        
        # Create variance chart
        fig2 = go.Figure()
        
        # Add bars for current cost
        fig2.add_trace(go.Bar(
            y=services,
            x=current_costs,
            name='Current Cost',
            orientation='h',
            marker=dict(color='rgba(58, 71, 80, 0.6)')
        ))
        
        # Add bars for budget allocation
        fig2.add_trace(go.Bar(
            y=services,
            x=budget_allocations,
            name='Budget Allocation',
            orientation='h',
            marker=dict(color='rgba(246, 78, 139, 0.6)')
        ))
        
        # Add variance text
        for i, (service, variance) in enumerate(zip(services, variances)):
            color = 'red' if variance > 0 else 'green'
            fig2.add_annotation(
                x=max(current_costs[i], budget_allocations[i]) + 100,
                y=service,
                text=f"{variance:+.1f}%",
                showarrow=False,
                font=dict(color=color)
            )
        
        fig2.update_layout(
            title="Budget Variance Analysis",
            barmode='group',
            height=600,
            margin=dict(l=20, r=100, t=50, b=20),
            xaxis_title="Cost (ETB)",
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        
        # Save the variance chart
        variance_path = self.report_dir / "budget_variance.html"
        fig2.write_html(str(variance_path))
        
        return treemap_path, variance_path
    
    def create_optimization_chart(self, recommendations: List[FinOpsRecommendation]) -> str:
        """Create optimization opportunities visualization"""
        
        # Prepare data
        services = [r.service for r in recommendations]
        savings = [r.potential_savings for r in recommendations]
        categories = [r.category.value for r in recommendations]
        priorities = [r.priority.value for r in recommendations]
        
        # Create bubble chart
        fig = px.scatter(
            x=range(len(services)),
            y=savings,
            size=savings,
            color=priorities,
            color_discrete_map={
                'critical': 'red',
                'high': 'orange',
                'medium': 'yellow',
                'low': 'green'
            },
            hover_name=services,
            hover_data={
                'x': False,
                'Service': services,
                'Category': categories,
                'Potential Savings': [f"{s:,.2f} ETB" for s in savings],
                'Priority': priorities
            },
            title="Cost Optimization Opportunities"
        )
        
        fig.update_layout(
            xaxis=dict(
                tickmode='array',
                tickvals=list(range(len(services))),
                ticktext=services,
                title="Service"
            ),
            yaxis_title="Potential Savings (ETB)",
            height=500
        )
        
        # Save the chart
        chart_path = self.report_dir / "optimization_opportunities.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_forecast_chart(self, forecasts: Dict[str, Any]) -> str:
        """Create budget forecast visualization"""
        
        # Create figure
        fig = go.Figure()
        
        # Add a line for each category
        for category, forecast_data in forecasts.items():
            predictions = forecast_data['predictions']
            confidence_intervals = forecast_data['confidence_intervals']
            
            # Add main line
            fig.add_trace(go.Scatter(
                x=list(range(1, len(predictions) + 1)),
                y=predictions,
                mode='lines+markers',
                name=category.title(),
                line=dict(width=2)
            ))
            
            # Add confidence interval
            lower_bound = [ci[0] for ci in confidence_intervals]
            upper_bound = [ci[1] for ci in confidence_intervals]
            
            fig.add_trace(go.Scatter(
                x=list(range(1, len(predictions) + 1)) + list(range(len(predictions), 0, -1)),
                y=upper_bound + lower_bound[::-1],
                fill='toself',
                fillcolor=f'rgba(0, 100, 80, 0.2)',
                line=dict(color='rgba(255, 255, 255, 0)'),
                showlegend=False,
                name=f"{category} CI"
            ))
        
        fig.update_layout(
            title="12-Month Cost Forecast by Category",
            xaxis_title="Month",
            yaxis_title="Projected Cost (ETB)",
            legend_title="Category",
            height=500
        )
        
        # Save the chart
        chart_path = self.report_dir / "cost_forecast.html"
        fig.write_html(str(chart_path))
        
        return str(chart_path)
    
    def create_financial_dashboard(self, cost_metrics: List[CostMetric], 
                                 revenue_metrics: List[RevenueMetric],
                                 recommendations: List[FinOpsRecommendation],
                                 cost_analysis: Dict[str, Any]) -> str:
        """Create an integrated financial dashboard"""
        
        # Calculate key metrics
        total_cost = sum(m.current_cost for m in cost_metrics)
        total_revenue = sum(m.current_value for m in revenue_metrics)
        total_savings_potential = sum(r.potential_savings for r in recommendations)
        profit_margin = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0
        
        # Create a figure with subplots
        fig = make_subplots(
            rows=2, cols=2,
            specs=[
                [{"type": "indicator"}, {"type": "indicator"}],
                [{"type": "pie"}, {"type": "bar"}]
            ],
            subplot_titles=("Profit Margin", "Cost Optimization Potential", 
                           "Cost Distribution", "Revenue vs. Target")
        )
        
        # Add profit margin gauge
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=profit_margin,
                domain={'x': [0, 1], 'y': [0, 1]},
                gauge={
                    'axis': {'range': [0, 30]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 5], 'color': "red"},
                        {'range': [5, 15], 'color': "yellow"},
                        {'range': [15, 30], 'color': "green"}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 4},
                        'thickness': 0.75,
                        'value': 15
                    }
                },
                title={'text': "Profit Margin (%)"}
            ),
            row=1, col=1
        )
        
        # Add cost optimization gauge
        optimization_percentage = (total_savings_potential / total_cost * 100) if total_cost > 0 else 0
        fig.add_trace(
            go.Indicator(
                mode="gauge+number",
                value=optimization_percentage,
                domain={'x': [0, 1], 'y': [0, 1]},
                gauge={
                    'axis': {'range': [0, 30]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 5], 'color': "red"},
                        {'range': [5, 15], 'color': "yellow"},
                        {'range': [15, 30], 'color': "green"}
                    ],
                    'threshold': {
                        'line': {'color': "black", 'width': 4},
                        'thickness': 0.75,
                        'value': 10
                    }
                },
                title={'text': "Optimization Potential (%)"}
            ),
            row=1, col=2
        )
        
        # Add cost distribution pie chart
        categories = list(cost_analysis['category_breakdown'].keys())
        category_costs = list(cost_analysis['category_breakdown'].values())
        
        fig.add_trace(
            go.Pie(
                labels=categories,
                values=category_costs,
                hole=.3,
                textinfo='label+percent'
            ),
            row=2, col=1
        )
        
        # Add revenue vs target bar chart
        revenue_names = [m.metric_name for m in revenue_metrics]
        current_values = [m.current_value for m in revenue_metrics]
        target_values = [m.target_value for m in revenue_metrics]
        
        fig.add_trace(
            go.Bar(
                x=revenue_names,
                y=current_values,
                name="Current",
                marker_color='rgb(26, 118, 255)'
            ),
            row=2, col=2
        )
        
        fig.add_trace(
            go.Bar(
                x=revenue_names,
                y=target_values,
                name="Target",
                marker_color='rgba(58, 71, 80, 0.6)'
            ),
            row=2, col=2
        )
        
        fig.update_layout(
            title_text="Financial Performance Dashboard",
            height=800,
            width=1000,
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        
        # Save the dashboard
        dashboard_path = self.report_dir / "financial_dashboard.html"
        fig.write_html(str(dashboard_path))
        
        return str(dashboard_path)

class FinancialReportGenerator:
    """Generates the executive financial summary report."""
    
    def __init__(self, db: FinOpsDatabase):
        self.db = db
    
    def generate_executive_summary(self, cost_metrics: List[CostMetric], 
                                 revenue_metrics: List[RevenueMetric],
                                 recommendations: List[FinOpsRecommendation],
                                 forecasts: Dict[str, Any]) -> str:
        """Generate executive financial summary"""
        
        total_cost = sum(m.current_cost for m in cost_metrics)
        total_revenue = sum(m.current_value for m in revenue_metrics)
        total_savings_potential = sum(r.potential_savings for r in recommendations)
        
        profit_margin = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0
        
        summary = f"""
# Executive Financial Summary

## Financial Health: {'🟢 STRONG' if profit_margin > 20 else '🟡 MODERATE' if profit_margin > 10 else '🔴 NEEDS ATTENTION'}

- **Current Monthly Revenue**: {total_revenue:,.2f} ETB
- **Current Monthly Costs**: {total_cost:,.2f} ETB
- **Profit Margin**: {profit_margin:.1f}%
- **Optimization Potential**: {total_savings_potential:,.2f} ETB ({(total_savings_potential/total_cost*100):.1f}% cost reduction)

## Key Financial Metrics:
"""
        
        # Revenue breakdown
        summary += "\n### Revenue Streams:\n"
        for metric in revenue_metrics:
            target_progress = (metric.current_value / metric.target_value * 100) if metric.target_value > 0 else 0
            summary += f"- **{metric.metric_name}**: {metric.current_value:,.2f} ETB ({target_progress:.1f}% of target)\n"
        
        # Cost optimization opportunities
        high_priority_recs = [r for r in recommendations if r.priority == OptimizationPriority.HIGH]
        if high_priority_recs:
            summary += "\n### Immediate Actions Required:\n"
            for rec in high_priority_recs[:3]:
                summary += f"- 💰 {rec.description} (Potential savings: {rec.potential_savings:,.2f} ETB)\n"
        
        return summary

async def main():
    """CFO Dashboard Main Execution"""
    logger.info("💰 Starting Enhanced CFO Financial Analysis...")
    
    db = FinOpsDatabase(FINOPS_DB)
    report_manager = ReportManager(REPORTS_DIR)
    viz_generator = FinancialVisualizationGenerator(REPORTS_DIR)

    # --- Data Analysis ---
    cost_analyzer = CloudCostAnalyzer()
    optimizer = FinOpsOptimizer()
    forecaster = BudgetForecaster()
    revenue_analyzer = RevenueAnalyzer()
    
    cost_metrics = await cost_analyzer.fetch_real_time_costs()
    cost_trends = cost_analyzer.analyze_cost_trends(cost_metrics)
    recommendations = optimizer.generate_recommendations(cost_metrics)
    forecasts = forecaster.forecast_costs(cost_metrics)
    revenue_metrics = revenue_analyzer.analyze_revenue_metrics()

    # --- Visualization Generation ---
    logger.info("📊 Generating interactive financial visualizations...")
    dashboard_path = viz_generator.create_financial_dashboard(
        cost_metrics, revenue_metrics, recommendations, cost_trends
    )
    report_manager.add_visualization("Overall Financial Dashboard", dashboard_path)

    # --- Report Generation ---
    report_generator = FinancialReportGenerator(db)
    
    executive_summary = report_generator.generate_executive_summary(
        cost_metrics, revenue_metrics, recommendations, forecasts
    )
    report_manager.add_section("Executive Financial Summary", executive_summary)

    cost_analysis_summary = report_generator.generate_cost_analysis_summary(cost_metrics, cost_trends)
    report_manager.add_section("Cloud Cost Analysis", cost_analysis_summary)

    recommendations_summary = report_generator.generate_recommendations_summary(recommendations)
    report_manager.add_section("FinOps Optimization Recommendations", recommendations_summary)

    forecast_summary = report_generator.generate_forecast_summary(forecasts)
    report_manager.add_section("Budget Forecast", forecast_summary)
    
    final_report_path = report_manager.save_report()
    
    safe_print(f"✅ CFO Financial analysis complete. Report generated at: {final_report_path}")

if __name__ == "__main__":
    asyncio.run(main())
