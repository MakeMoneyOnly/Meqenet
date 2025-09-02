"""
Meqenet.et Governance Dashboards Package

This package contains all executive dashboards for the governance framework:
- CEO Dashboard: Strategic business intelligence and executive oversight
- CFO Dashboard: Financial performance and FinOps analytics
- CTO Dashboard: Technical infrastructure and system health monitoring
- CCO Dashboard: Regulatory compliance and risk management
- CISO Dashboard: Security posture and threat intelligence
- Unified Dashboard: Cross-functional executive summary

Author: Meqenet.et Governance Team
"""

from .ceo import main as run_ceo_dashboard
from .cfo import main as run_cfo_dashboard
from .cto import main as run_cto_dashboard
from .cco import main as run_cco_dashboard
from .ciso import main as run_ciso_dashboard
from .unified import main as run_unified_dashboard

__all__ = [
    'run_ceo_dashboard',
    'run_cfo_dashboard',
    'run_cto_dashboard',
    'run_cco_dashboard',
    'run_ciso_dashboard',
    'run_unified_dashboard'
]

__version__ = "2.0.0"
__description__ = "Enterprise governance dashboards for Meqenet.et fintech platform"
