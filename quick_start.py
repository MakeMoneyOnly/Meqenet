#!/usr/bin/env python3
"""
Meqenet.et Governance Framework Quick Start
Cross-platform launcher for the governance suite
"""

import sys
import subprocess
from pathlib import Path

def main():
    print("🏛️  Meqenet.et Governance Framework")
    print("=" * 50)
    print()
    print("Choose an option:")
    print("1. Run all dashboards once")
    print("2. Run specific dashboard") 
    print("3. Start scheduled execution")
    print("4. View latest reports")
    print("5. Check system status")
    print("6. Exit")
    print()
    
    choice = input("Enter your choice (1-6): ").strip()
    
    governance_dir = Path(__file__).parent / "governance"
    deploy_script = governance_dir / "deploy_governance_suite.py"
    
    if choice == "1":
        print("\n🎯 Running all dashboards...")
        subprocess.run([sys.executable, str(deploy_script), "--mode", "run"])
    
    elif choice == "2":
        dashboard = input("Enter dashboard (ceo/cfo/cto/cco/ciso): ").strip().lower()
        if dashboard in ["ceo", "cfo", "cto", "cco", "ciso"]:
            print(f"\n🎯 Running {dashboard.upper()} dashboard...")
            subprocess.run([sys.executable, str(deploy_script), "--mode", "run", "--dashboard", dashboard])
        else:
            print("❌ Invalid dashboard name")
    
    elif choice == "3":
        print("\n🕒 Starting scheduled execution...")
        print("Press Ctrl+C to stop")
        subprocess.run([sys.executable, str(deploy_script), "--mode", "schedule"])
    
    elif choice == "4":
        print("\n📄 Latest reports:")
        reports_dir = governance_dir / "reports"
        if reports_dir.exists():
            reports = sorted(reports_dir.glob("*.md"), key=lambda x: x.stat().st_mtime, reverse=True)
            for i, report in enumerate(reports[:5], 1):
                print(f"{i}. {report.name}")
        else:
            print("No reports found. Run dashboards first.")
    
    elif choice == "5":
        print("\n📊 System status:")
        try:
            import yaml, pandas, numpy
            print("✅ Dependencies: OK")
        except ImportError as e:
            print(f"❌ Missing dependencies: {e}")
        
        config_file = governance_dir / "config" / "governance_config.yaml"
        if config_file.exists():
            print("✅ Configuration: OK")
        else:
            print("❌ Configuration: Missing")
    
    elif choice == "6":
        print("👋 Goodbye!")
        sys.exit(0)
    
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
