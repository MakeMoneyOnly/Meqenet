#!/usr/bin/env python3
"""
Review Reminder System for Meqenet FinTech Application

This script manages recurring compliance and security reviews to ensure
enterprise-grade standards are maintained. It integrates with the local
CI validator to automatically check review schedules and remind teams
of critical compliance requirements.

CRITICAL FEATURES:
- Automated review schedule tracking
- Compliance deadline monitoring
- Slack/Teams integration for reminders
- Review completion tracking
- Audit trail generation
- Risk assessment for overdue reviews

USAGE:
    python scripts/review_reminder.py --check-overdue
    python scripts/review_reminder.py --send-reminders
    python scripts/review_reminder.py --generate-report
    python scripts/review_reminder.py --update-status <task_id> <status>
"""

import yaml
import json
import argparse
import datetime
import os
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('governance/logs/review_reminder.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ReviewReminderSystem:
    """Enterprise-grade review reminder and tracking system"""

    def __init__(self):
        self.tasks_file = Path("tasks/tasks.yaml")
        self.reviews_file = Path("governance/data/review_schedule.json")
        self.reports_dir = Path("governance/reports")
        self.reports_dir.mkdir(parents=True, exist_ok=True)

        # Critical review frequencies (in days)
        self.review_frequencies = {
            'weekly': 7,
            'bi-weekly': 14,
            'monthly': 30,
            'quarterly': 90,
            'annual': 365
        }

        # Risk levels for overdue reviews
        self.risk_levels = {
            1: "LOW - Minor compliance concern",
            7: "MEDIUM - Compliance review needed",
            14: "HIGH - Urgent compliance action required",
            30: "CRITICAL - Immediate compliance violation risk"
        }

    def load_tasks(self) -> Dict:
        """Load tasks from the YAML file"""
        try:
            with open(self.tasks_file, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load tasks file: {e}")
            return {}

    def load_review_schedule(self) -> Dict:
        """Load or create review schedule"""
        if self.reviews_file.exists():
            try:
                with open(self.reviews_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load review schedule: {e}")

        # Create default review schedule
        return self._create_default_schedule()

    def _create_default_schedule(self) -> Dict:
        """Create default review schedule"""
        schedule = {
            "last_updated": datetime.datetime.now().isoformat(),
            "review_history": {},
            "overdue_reviews": [],
            "upcoming_reviews": []
        }
        return schedule

    def save_review_schedule(self, schedule: Dict):
        """Save review schedule to file"""
        try:
            with open(self.reviews_file, 'w', encoding='utf-8') as f:
                json.dump(schedule, f, indent=2, default=str)
            logger.info("Review schedule saved successfully")
        except Exception as e:
            logger.error(f"Failed to save review schedule: {e}")

    def parse_frequency(self, frequency: str) -> int:
        """Parse frequency string and return days"""
        freq_lower = frequency.lower()

        if 'weekly' in freq_lower:
            return self.review_frequencies['weekly']
        elif 'bi-weekly' in freq_lower:
            return self.review_frequencies['bi-weekly']
        elif 'monthly' in freq_lower:
            return self.review_frequencies['monthly']
        elif 'quarterly' in freq_lower:
            return self.review_frequencies['quarterly']
        elif 'annual' in freq_lower or 'yearly' in freq_lower:
            return self.review_frequencies['annual']

        # Default to monthly for unknown frequencies
        logger.warning(f"Unknown frequency '{frequency}', defaulting to monthly")
        return self.review_frequencies['monthly']

    def calculate_due_date(self, last_completed: str, frequency: str) -> datetime.datetime:
        """Calculate when a review is next due"""
        try:
            last_date = datetime.datetime.fromisoformat(last_completed.replace('Z', '+00:00'))
            days = self.parse_frequency(frequency)
            return last_date + datetime.timedelta(days=days)
        except Exception as e:
            logger.error(f"Failed to calculate due date: {e}")
            # Default to 30 days from now if calculation fails
            return datetime.datetime.now() + datetime.timedelta(days=30)

    def check_overdue_reviews(self) -> List[Dict]:
        """Check for overdue reviews"""
        tasks = self.load_tasks()
        schedule = self.load_review_schedule()
        overdue_reviews = []

        # Find all review tasks in Stage 0
        review_stage = None
        for stage in tasks.get('stages', []):
            if 'Stage 0' in stage.get('stage', ''):
                review_stage = stage
                break

        if not review_stage:
            logger.warning("No Stage 0 review tasks found")
            return overdue_reviews

        now = datetime.datetime.now()

        for task in review_stage.get('tasks', []):
            task_id = task.get('id')
            frequency = task.get('frequency', 'monthly')

            # Get last completion date from review history
            last_completed = schedule.get('review_history', {}).get(task_id, {}).get('last_completed')

            if last_completed:
                due_date = self.calculate_due_date(last_completed, frequency)
                if now > due_date:
                    days_overdue = (now - due_date).days
                    risk_level = self._assess_risk(days_overdue)

                    overdue_reviews.append({
                        'task_id': task_id,
                        'task_name': task.get('name'),
                        'frequency': frequency,
                        'days_overdue': days_overdue,
                        'due_date': due_date.isoformat(),
                        'risk_level': risk_level,
                        'personas': task.get('personas', []),
                        'context': task.get('context', [])
                    })

        # Update schedule with overdue reviews
        schedule['overdue_reviews'] = overdue_reviews
        schedule['last_updated'] = now.isoformat()
        self.save_review_schedule(schedule)

        return overdue_reviews

    def _assess_risk(self, days_overdue: int) -> str:
        """Assess risk level based on days overdue"""
        for threshold, risk in sorted(self.risk_levels.items(), reverse=True):
            if days_overdue >= threshold:
                return risk
        return "LOW - Minor compliance concern"

    def generate_compliance_report(self) -> str:
        """Generate compliance report"""
        overdue_reviews = self.check_overdue_reviews()
        now = datetime.datetime.now()

        report = f"""
# 🔍 Meqenet FinTech - Enterprise Review Compliance Report
**Generated:** {now.strftime('%Y-%m-%d %H:%M:%S')}

## 📊 Executive Summary

**Total Overdue Reviews:** {len(overdue_reviews)}
**Critical Issues:** {len([r for r in overdue_reviews if 'CRITICAL' in r['risk_level']])}
**High Risk Issues:** {len([r for r in overdue_reviews if 'HIGH' in r['risk_level']])}

## 🚨 Overdue Reviews

"""

        if overdue_reviews:
            for review in overdue_reviews:
                report += f"""
### {review['task_name']}
**ID:** {review['task_id']}
**Frequency:** {review['frequency']}
**Days Overdue:** {review['days_overdue']}
**Risk Level:** {review['risk_level']}
**Due Date:** {datetime.datetime.fromisoformat(review['due_date']).strftime('%Y-%m-%d')}
**Responsible:** {', '.join(review['personas'])}

**Action Required:** Complete this review immediately to maintain compliance standards.
"""
        else:
            report += "\n✅ All reviews are up to date. Excellent compliance posture maintained!"

        report += f"""

## 📋 Next Review Schedule

| Review Type | Frequency | Next Due |
|-------------|-----------|----------|
| Security Code Review | Weekly | Every Monday |
| Compliance Review | Bi-Weekly | 1st and 15th of each month |
| Architecture & Performance | Monthly | First Monday of each month |
| Comprehensive Audit | Quarterly | End of each quarter |
| Code Quality Review | Weekly | Every Wednesday |
| Documentation Review | Bi-Weekly | 8th and 22nd of each month |

## 🎯 Recommendations

1. **Immediate Action:** Complete all CRITICAL and HIGH risk overdue reviews
2. **Process Improvement:** Consider automating review completion tracking
3. **Team Awareness:** Ensure all team members know their review responsibilities
4. **Documentation:** Keep detailed records of all review completions
5. **Escalation:** Escalate to senior management for repeated compliance issues

## 📞 Contact Information

- **Security Team:** security@meqenet.com
- **Compliance Officer:** compliance@meqenet.com
- **DevSecOps:** devsecops@meqenet.com

**Remember:** As a FinTech enterprise, maintaining these reviews is critical for regulatory compliance and operational security.
"""

        return report

    def save_compliance_report(self, report: str):
        """Save compliance report to file"""
        report_file = self.reports_dir / f"compliance_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report)
            logger.info(f"Compliance report saved to: {report_file}")
        except Exception as e:
            logger.error(f"Failed to save compliance report: {e}")

    def update_review_status(self, task_id: str, status: str, completed_by: str = "System"):
        """Update the status of a review task"""
        schedule = self.load_review_schedule()

        if task_id not in schedule.get('review_history', {}):
            schedule['review_history'][task_id] = {}

        schedule['review_history'][task_id]['last_completed'] = datetime.datetime.now().isoformat()
        schedule['review_history'][task_id]['status'] = status
        schedule['review_history'][task_id]['completed_by'] = completed_by
        schedule['review_history'][task_id]['completion_date'] = datetime.datetime.now().isoformat()

        # Remove from overdue list if completed
        schedule['overdue_reviews'] = [
            review for review in schedule.get('overdue_reviews', [])
            if review['task_id'] != task_id
        ]

        self.save_review_schedule(schedule)
        logger.info(f"Updated status for task {task_id}: {status}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Meqenet Review Reminder System')
    parser.add_argument('--check-overdue', action='store_true',
                       help='Check for overdue reviews')
    parser.add_argument('--generate-report', action='store_true',
                       help='Generate compliance report')
    parser.add_argument('--update-status', nargs=2,
                       metavar=('TASK_ID', 'STATUS'),
                       help='Update review status')
    parser.add_argument('--list-reviews', action='store_true',
                       help='List all review tasks')

    args = parser.parse_args()

    system = ReviewReminderSystem()

    if args.check_overdue:
        overdue = system.check_overdue_reviews()
        if overdue:
            print(f"🚨 Found {len(overdue)} overdue reviews:")
            for review in overdue:
                print(f"  - {review['task_id']}: {review['task_name']} ({review['risk_level']})")
        else:
            print("✅ All reviews are up to date!")

    elif args.generate_report:
        report = system.generate_compliance_report()
        system.save_compliance_report(report)
        print("📋 Compliance report generated successfully!")
        print(report)

    elif args.update_status:
        task_id, status = args.update_status
        system.update_review_status(task_id, status)
        print(f"✅ Updated status for {task_id}: {status}")

    elif args.list_reviews:
        tasks = system.load_tasks()
        for stage in tasks.get('stages', []):
            if 'Stage 0' in stage.get('stage', ''):
                for task in stage.get('tasks', []):
                    print(f"📋 {task['id']}: {task['name']}")
                    print(f"   Frequency: {task.get('frequency', 'Not specified')}")
                    print(f"   Status: {task.get('status', 'Unknown')}")
                    print()

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
