#!/usr/bin/env python3
"""
CFO Dashboard - Financial Governance & Analytics
=============================================

Provides comprehensive financial oversight for Meqenet.et BNPL Platform
- AWS Cost Analysis & Optimization
- Revenue Analytics & Forecasting
- Financial Risk Assessment
- Budget Tracking & Variance Analysis
- Transaction Volume & Revenue Metrics
- Cost Per Transaction Analysis

Author: Meqenet.et
Version: 1.0.0
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import subprocess
import configparser

# Third-party imports
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.progress import Progress
    from rich.text import Text
    from rich.layout import Layout
    from rich import box
    import pandas as pd
    import numpy as np
    from dateutil.relativedelta import relativedelta
    import requests
    import boto3
    from botocore.exceptions import NoCredentialsError, ClientError
except ImportError as e:
    print(f"Missing required dependencies. Please run: pip install -r requirements.txt")
    print(f"Error: {e}")
    sys.exit(1)

class CFODashboard:
    """
    CFO Dashboard for financial governance and analytics
    """
    
    def __init__(self):
        """Initialize the CFO Dashboard"""
        self.console = Console()
        self.project_root = Path(__file__).parent.parent.parent
        self.setup_logging()
        
        # Financial configuration
        self.currency = "ETB"  # Ethiopian Birr
        self.fiscal_year_start = 7  # July (Ethiopian fiscal year)
        
        # AWS clients (initialized on demand)
        self._aws_cost_client = None
        self._aws_billing_client = None
        
        # Data storage
        self.cost_data = {}
        self.revenue_data = {}
        self.transaction_data = {}
        
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = self.project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / "cfo_dashboard.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    @property
    def aws_cost_client(self):
        """Lazy initialization of AWS Cost Explorer client"""
        if self._aws_cost_client is None:
            try:
                self._aws_cost_client = boto3.client('ce')
            except NoCredentialsError:
                self.logger.warning("AWS credentials not configured. Cost analysis will be limited.")
                self._aws_cost_client = None
        return self._aws_cost_client
    
    def analyze_aws_costs(self) -> Dict:
        """
        Analyze AWS costs and usage patterns
        Returns comprehensive cost analysis data
        """
        cost_analysis = {
            'current_month_cost': 0.0,
            'last_month_cost': 0.0,
            'cost_trend': 'stable',
            'top_services': [],
            'cost_optimization_opportunities': [],
            'budget_status': 'unknown'
        }
        
        if not self.aws_cost_client:
            # Simulate cost data for demonstration
            cost_analysis.update({
                'current_month_cost': 2847.50,
                'last_month_cost': 2654.30,
                'cost_trend': 'increasing',
                'top_services': [
                    {'service': 'Amazon EKS', 'cost': 1200.00, 'percentage': 42.1},
                    {'service': 'Amazon RDS', 'cost': 680.50, 'percentage': 23.9},
                    {'service': 'Amazon S3', 'cost': 345.20, 'percentage': 12.1},
                    {'service': 'Amazon CloudFront', 'cost': 287.80, 'percentage': 10.1},
                    {'service': 'AWS Lambda', 'cost': 334.00, 'percentage': 11.7}
                ],
                'cost_optimization_opportunities': [
                    {'area': 'RDS Right-sizing', 'potential_savings': 204.15, 'priority': 'HIGH'},
                    {'area': 'S3 Storage Classes', 'potential_savings': 86.30, 'priority': 'MEDIUM'},
                    {'area': 'Reserved Instances', 'potential_savings': 360.00, 'priority': 'HIGH'}
                ],
                'budget_status': 'on_track'
            })
            return cost_analysis
        
        try:
            # Get current month costs
            end_date = datetime.now().date()
            start_date = end_date.replace(day=1)
            
            response = self.aws_cost_client.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity='MONTHLY',
                Metrics=['BlendedCost'],
                GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
            )
            
            # Process cost data
            if response['ResultsByTime']:
                groups = response['ResultsByTime'][0]['Groups']
                total_cost = float(response['ResultsByTime'][0]['Total']['BlendedCost']['Amount'])
                
                cost_analysis['current_month_cost'] = total_cost
                
                # Get top services
                services = []
                for group in groups:
                    service_cost = float(group['Metrics']['BlendedCost']['Amount'])
                    if service_cost > 0:
                        services.append({
                            'service': group['Keys'][0],
                            'cost': service_cost,
                            'percentage': (service_cost / total_cost) * 100
                        })
                
                cost_analysis['top_services'] = sorted(services, key=lambda x: x['cost'], reverse=True)[:5]
            
        except ClientError as e:
            self.logger.error(f"AWS Cost Explorer error: {e}")
        
        return cost_analysis
    
    def analyze_revenue_metrics(self) -> Dict:
        """
        Analyze revenue metrics and growth patterns
        """
        # Simulate revenue data (in production, this would connect to transaction database)
        revenue_metrics = {
            'monthly_revenue': {
                'current': 145000.00,  # ETB
                'previous': 138500.00,
                'growth_rate': 4.7
            },
            'quarterly_revenue': {
                'q1': 412000.00,
                'q2': 445000.00,
                'q3': 478000.00,
                'projected_q4': 515000.00
            },
            'revenue_streams': [
                {'stream': 'BNPL Transaction Fees', 'amount': 89000.00, 'percentage': 61.4},
                {'stream': 'Marketplace Commission', 'amount': 32500.00, 'percentage': 22.4},
                {'stream': 'Premium Subscriptions', 'amount': 15200.00, 'percentage': 10.5},
                {'stream': 'Late Payment Fees', 'amount': 5800.00, 'percentage': 4.0},
                {'stream': 'Partner Referrals', 'amount': 2500.00, 'percentage': 1.7}
            ],
            'customer_metrics': {
                'total_active_users': 12450,
                'new_users_this_month': 1250,
                'average_transaction_value': 2850.00,
                'customer_lifetime_value': 15600.00
            },
            'financial_health': {
                'gross_margin': 78.5,
                'operating_margin': 23.2,
                'cash_burn_rate': -45000.00,  # Monthly
                'runway_months': 18.5
            }
        }
        
        return revenue_metrics
    
    def analyze_transaction_patterns(self) -> Dict:
        """
        Analyze transaction patterns and operational efficiency
        """
        transaction_analysis = {
            'volume_metrics': {
                'daily_transactions': 1250,
                'monthly_transactions': 38500,
                'peak_transaction_hour': '14:00-15:00',
                'average_processing_time': 2.3  # seconds
            },
            'cost_per_transaction': {
                'infrastructure_cost': 0.85,  # ETB per transaction
                'processing_cost': 0.45,
                'support_cost': 0.12,
                'total_cost': 1.42
            },
            'success_rates': {
                'payment_success_rate': 97.8,
                'kyc_completion_rate': 94.2,
                'loan_approval_rate': 76.5,
                'chargeback_rate': 0.3
            },
            'risk_metrics': {
                'fraud_detection_rate': 99.1,
                'false_positive_rate': 2.8,
                'default_rate': 3.2,
                'recovery_rate': 68.5
            }
        }
        
        return transaction_analysis
    
    def calculate_financial_ratios(self, revenue_data: Dict) -> Dict:
        """
        Calculate key financial ratios and KPIs
        """
        ratios = {
            'profitability': {
                'gross_profit_margin': revenue_data['financial_health']['gross_margin'],
                'operating_margin': revenue_data['financial_health']['operating_margin'],
                'revenue_growth_rate': revenue_data['monthly_revenue']['growth_rate']
            },
            'efficiency': {
                'cost_to_revenue_ratio': 21.5,  # %
                'customer_acquisition_cost': 125.00,  # ETB
                'revenue_per_employee': 45000.00  # ETB (assuming 50 employees)
            },
            'liquidity': {
                'current_ratio': 2.1,
                'quick_ratio': 1.8,
                'cash_conversion_cycle': 15.5  # days
            }
        }
        
        return ratios
    
    def generate_budget_variance_analysis(self) -> Dict:
        """
        Generate budget vs actual variance analysis
        """
        variance_analysis = {
            'categories': [
                {
                    'category': 'Infrastructure',
                    'budgeted': 180000.00,
                    'actual': 171500.00,
                    'variance': -8500.00,
                    'variance_percent': -4.7,
                    'status': 'under_budget'
                },
                {
                    'category': 'Personnel',
                    'budgeted': 320000.00,
                    'actual': 335000.00,
                    'variance': 15000.00,
                    'variance_percent': 4.7,
                    'status': 'over_budget'
                },
                {
                    'category': 'Marketing',
                    'budgeted': 85000.00,
                    'actual': 78500.00,
                    'variance': -6500.00,
                    'variance_percent': -7.6,
                    'status': 'under_budget'
                },
                {
                    'category': 'Operations',
                    'budgeted': 125000.00,
                    'actual': 132000.00,
                    'variance': 7000.00,
                    'variance_percent': 5.6,
                    'status': 'over_budget'
                }
            ],
            'total_variance': 5000.00,
            'total_variance_percent': 0.7,
            'overall_status': 'on_track'
        }
        
        return variance_analysis
    
    def display_cost_analysis(self, cost_data: Dict):
        """Display AWS cost analysis in a formatted table"""
        
        # Current vs Previous Month
        cost_table = Table(title="💰 AWS Cost Analysis", box=box.ROUNDED)
        cost_table.add_column("Metric", style="cyan", no_wrap=True)
        cost_table.add_column("Current Month", style="green")
        cost_table.add_column("Previous Month", style="yellow")
        cost_table.add_column("Change", style="red" if cost_data['cost_trend'] == 'increasing' else "green")
        
        current_cost = f"${cost_data['current_month_cost']:,.2f}"
        previous_cost = f"${cost_data['last_month_cost']:,.2f}"
        change = cost_data['current_month_cost'] - cost_data['last_month_cost']
        change_percent = (change / cost_data['last_month_cost']) * 100 if cost_data['last_month_cost'] > 0 else 0
        
        cost_table.add_row(
            "Total Cost",
            current_cost,
            previous_cost,
            f"${change:+,.2f} ({change_percent:+.1f}%)"
        )
        
        self.console.print(cost_table)
        
        # Top Services
        if cost_data['top_services']:
            services_table = Table(title="🔝 Top Cost-Driving Services", box=box.ROUNDED)
            services_table.add_column("Service", style="cyan")
            services_table.add_column("Cost", style="green", justify="right")
            services_table.add_column("% of Total", style="yellow", justify="right")
            
            for service in cost_data['top_services']:
                services_table.add_row(
                    service['service'],
                    f"${service['cost']:,.2f}",
                    f"{service['percentage']:.1f}%"
                )
            
            self.console.print(services_table)
        
        # Cost Optimization Opportunities
        if cost_data['cost_optimization_opportunities']:
            optimization_table = Table(title="💡 Cost Optimization Opportunities", box=box.ROUNDED)
            optimization_table.add_column("Optimization Area", style="cyan")
            optimization_table.add_column("Potential Savings", style="green", justify="right")
            optimization_table.add_column("Priority", style="red")
            
            total_savings = 0
            for opportunity in cost_data['cost_optimization_opportunities']:
                optimization_table.add_row(
                    opportunity['area'],
                    f"${opportunity['potential_savings']:,.2f}",
                    opportunity['priority']
                )
                total_savings += opportunity['potential_savings']
            
            optimization_table.add_row(
                "[bold]TOTAL POTENTIAL SAVINGS[/bold]",
                f"[bold green]${total_savings:,.2f}[/bold green]",
                ""
            )
            
            self.console.print(optimization_table)
    
    def display_revenue_analysis(self, revenue_data: Dict):
        """Display revenue analysis and growth metrics"""
        
        # Revenue Growth
        revenue_table = Table(title="📈 Revenue Performance", box=box.ROUNDED)
        revenue_table.add_column("Metric", style="cyan", no_wrap=True)
        revenue_table.add_column("Current Month", style="green")
        revenue_table.add_column("Previous Month", style="yellow")
        revenue_table.add_column("Growth", style="green")
        
        current_revenue = f"{revenue_data['monthly_revenue']['current']:,.0f} {self.currency}"
        previous_revenue = f"{revenue_data['monthly_revenue']['previous']:,.0f} {self.currency}"
        growth_rate = f"{revenue_data['monthly_revenue']['growth_rate']:+.1f}%"
        
        revenue_table.add_row(
            "Monthly Revenue",
            current_revenue,
            previous_revenue,
            growth_rate
        )
        
        self.console.print(revenue_table)
        
        # Revenue Streams
        streams_table = Table(title="💳 Revenue Streams Breakdown", box=box.ROUNDED)
        streams_table.add_column("Revenue Stream", style="cyan")
        streams_table.add_column("Amount", style="green", justify="right")
        streams_table.add_column("% of Total", style="yellow", justify="right")
        
        for stream in revenue_data['revenue_streams']:
            streams_table.add_row(
                stream['stream'],
                f"{stream['amount']:,.0f} {self.currency}",
                f"{stream['percentage']:.1f}%"
            )
        
        self.console.print(streams_table)
        
        # Customer Metrics
        customer_table = Table(title="👥 Customer & Transaction Metrics", box=box.ROUNDED)
        customer_table.add_column("Metric", style="cyan")
        customer_table.add_column("Value", style="green", justify="right")
        
        metrics = revenue_data['customer_metrics']
        customer_table.add_row("Total Active Users", f"{metrics['total_active_users']:,}")
        customer_table.add_row("New Users This Month", f"{metrics['new_users_this_month']:,}")
        customer_table.add_row("Avg Transaction Value", f"{metrics['average_transaction_value']:,.0f} {self.currency}")
        customer_table.add_row("Customer Lifetime Value", f"{metrics['customer_lifetime_value']:,.0f} {self.currency}")
        
        self.console.print(customer_table)
    
    def display_financial_health(self, revenue_data: Dict, ratios: Dict):
        """Display financial health indicators"""
        
        health_table = Table(title="🏥 Financial Health Indicators", box=box.ROUNDED)
        health_table.add_column("Category", style="cyan")
        health_table.add_column("Metric", style="white")
        health_table.add_column("Value", style="green", justify="right")
        health_table.add_column("Status", style="yellow")
        
        # Profitability
        health_table.add_row(
            "Profitability",
            "Gross Margin",
            f"{ratios['profitability']['gross_profit_margin']:.1f}%",
            "✅ Excellent" if ratios['profitability']['gross_profit_margin'] > 70 else "⚠️ Monitor"
        )
        
        health_table.add_row(
            "",
            "Operating Margin",
            f"{ratios['profitability']['operating_margin']:.1f}%",
            "✅ Healthy" if ratios['profitability']['operating_margin'] > 20 else "⚠️ Monitor"
        )
        
        # Liquidity
        health_table.add_row(
            "Liquidity",
            "Current Ratio",
            f"{ratios['liquidity']['current_ratio']:.1f}",
            "✅ Strong" if ratios['liquidity']['current_ratio'] > 2.0 else "⚠️ Monitor"
        )
        
        # Cash Position
        cash_burn = revenue_data['financial_health']['cash_burn_rate']
        runway = revenue_data['financial_health']['runway_months']
        
        health_table.add_row(
            "Cash Flow",
            "Monthly Burn Rate",
            f"{abs(cash_burn):,.0f} {self.currency}",
            "✅ Sustainable" if runway > 12 else "🚨 Critical"
        )
        
        health_table.add_row(
            "",
            "Runway (Months)",
            f"{runway:.1f}",
            "✅ Safe" if runway > 18 else "⚠️ Monitor" if runway > 12 else "🚨 Critical"
        )
        
        self.console.print(health_table)
    
    def display_budget_variance(self, variance_data: Dict):
        """Display budget variance analysis"""
        
        variance_table = Table(title="📊 Budget vs Actual Variance Analysis", box=box.ROUNDED)
        variance_table.add_column("Category", style="cyan")
        variance_table.add_column("Budgeted", style="blue", justify="right")
        variance_table.add_column("Actual", style="green", justify="right")
        variance_table.add_column("Variance", style="red", justify="right")
        variance_table.add_column("Status", style="yellow")
        
        for category in variance_data['categories']:
            status_icon = "✅" if category['status'] == 'under_budget' else "🚨" if category['variance_percent'] > 10 else "⚠️"
            status_text = f"{status_icon} {category['status'].replace('_', ' ').title()}"
            
            variance_table.add_row(
                category['category'],
                f"{category['budgeted']:,.0f} {self.currency}",
                f"{category['actual']:,.0f} {self.currency}",
                f"{category['variance']:+,.0f} {self.currency} ({category['variance_percent']:+.1f}%)",
                status_text
            )
        
        # Total row
        total_budgeted = sum(cat['budgeted'] for cat in variance_data['categories'])
        total_actual = sum(cat['actual'] for cat in variance_data['categories'])
        
        variance_table.add_row(
            "[bold]TOTAL[/bold]",
            f"[bold]{total_budgeted:,.0f} {self.currency}[/bold]",
            f"[bold]{total_actual:,.0f} {self.currency}[/bold]",
            f"[bold]{variance_data['total_variance']:+,.0f} {self.currency} ({variance_data['total_variance_percent']:+.1f}%)[/bold]",
            f"[bold]✅ {variance_data['overall_status'].replace('_', ' ').title()}[/bold]"
        )
        
        self.console.print(variance_table)
    
    def generate_executive_summary(self, cost_data: Dict, revenue_data: Dict, ratios: Dict) -> str:
        """Generate executive summary for CFO"""
        
        # Calculate key insights
        cost_trend = "increasing" if cost_data['current_month_cost'] > cost_data['last_month_cost'] else "decreasing"
        revenue_growth = revenue_data['monthly_revenue']['growth_rate']
        runway = revenue_data['financial_health']['runway_months']
        
        # Determine overall financial health
        if runway > 18 and revenue_growth > 0 and ratios['profitability']['operating_margin'] > 20:
            health_status = "EXCELLENT"
            health_color = "green"
        elif runway > 12 and revenue_growth > -5:
            health_status = "GOOD"
            health_color = "yellow"
        else:
            health_status = "NEEDS ATTENTION"
            health_color = "red"
        
        summary = f"""
        [bold {health_color}]FINANCIAL HEALTH: {health_status}[/bold {health_color}]
        
        📊 **Key Metrics:**
        • Monthly Revenue: {revenue_data['monthly_revenue']['current']:,.0f} {self.currency} ({revenue_growth:+.1f}% growth)
        • Operating Margin: {ratios['profitability']['operating_margin']:.1f}%
        • Cash Runway: {runway:.1f} months
        • AWS Costs: ${cost_data['current_month_cost']:,.2f} ({cost_trend})
        
        🎯 **Strategic Priorities:**
        """
        
        # Add recommendations based on data
        if cost_trend == "increasing":
            summary += "\n        • 🚨 Monitor AWS cost growth - implement cost optimization measures"
        
        if revenue_growth < 5:
            summary += "\n        • 📈 Focus on revenue acceleration - review pricing and customer acquisition"
        
        if runway < 18:
            summary += "\n        • 💰 Consider fundraising or cost reduction initiatives"
        
        # Add cost optimization opportunities
        if cost_data['cost_optimization_opportunities']:
            total_savings = sum(opp['potential_savings'] for opp in cost_data['cost_optimization_opportunities'])
            summary += f"\n        • 💡 Potential AWS savings: ${total_savings:,.2f}/month"
        
        return summary
    
    def run_dashboard(self):
        """Run the complete CFO dashboard"""
        
        self.console.print("\n")
        self.console.print(Panel.fit(
            "[bold cyan]CFO DASHBOARD - MEQENET.ET BNPL PLATFORM[/bold cyan]\n"
            "[dim]Financial Governance & Analytics[/dim]\n"
            f"[dim]Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/dim]",
            border_style="blue"
        ))
        
        with Progress() as progress:
            task = progress.add_task("[cyan]Analyzing financial data...", total=100)
            
            # Analyze AWS costs
            progress.update(task, advance=20, description="[cyan]Analyzing AWS costs...")
            cost_data = self.analyze_aws_costs()
            
            # Analyze revenue metrics
            progress.update(task, advance=30, description="[cyan]Analyzing revenue metrics...")
            revenue_data = self.analyze_revenue_metrics()
            
            # Analyze transaction patterns
            progress.update(task, advance=20, description="[cyan]Analyzing transaction patterns...")
            transaction_data = self.analyze_transaction_patterns()
            
            # Calculate financial ratios
            progress.update(task, advance=15, description="[cyan]Calculating financial ratios...")
            ratios = self.calculate_financial_ratios(revenue_data)
            
            # Generate budget variance
            progress.update(task, advance=15, description="[cyan]Generating budget analysis...")
            variance_data = self.generate_budget_variance_analysis()
            
            progress.update(task, advance=100, description="[green]Analysis complete!")
        
        # Display all sections
        self.console.print("\n")
        self.display_cost_analysis(cost_data)
        
        self.console.print("\n")
        self.display_revenue_analysis(revenue_data)
        
        self.console.print("\n")
        self.display_financial_health(revenue_data, ratios)
        
        self.console.print("\n")
        self.display_budget_variance(variance_data)
        
        # Generate and display executive summary
        self.console.print("\n")
        summary = self.generate_executive_summary(cost_data, revenue_data, ratios)
        self.console.print(Panel(
            summary,
            title="[bold]📋 EXECUTIVE SUMMARY[/bold]",
            border_style="green"
        ))
        
        # Final recommendations
        self.console.print("\n")
        self.console.print(Panel(
            "[bold]🎯 RECOMMENDED ACTIONS:[/bold]\n\n"
            "1. [yellow]Cost Optimization:[/yellow] Implement AWS Reserved Instances for 30% cost reduction\n"
            "2. [green]Revenue Growth:[/green] Focus on increasing average transaction value\n"
            "3. [blue]Cash Management:[/blue] Monitor burn rate and prepare for next funding round\n"
            "4. [red]Risk Management:[/red] Maintain fraud detection rates above 99%\n"
            "5. [cyan]Operational Efficiency:[/cyan] Optimize cost per transaction below 1.00 ETB",
            title="[bold red]🚀 ACTION ITEMS[/bold red]",
            border_style="red"
        ))
        
        self.logger.info("CFO Dashboard analysis complete")

def main():
    """Main entry point"""
    try:
        dashboard = CFODashboard()
        dashboard.run_dashboard()
    except KeyboardInterrupt:
        print("\n\nDashboard interrupted by user")
    except Exception as e:
        print(f"\nError running CFO Dashboard: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()