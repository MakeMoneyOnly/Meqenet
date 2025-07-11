import json
from datetime import datetime, timedelta
from pathlib import Path
import random

# Configuration
REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

# --- 1. Git & Code Review Metrics Simulation ---
def fetch_developer_metrics():
    """
    Simulates fetching developer productivity and code quality metrics from Git repositories
    and code review platforms (e.g., GitHub, GitLab, Azure DevOps).
    """
    print("Fetching developer productivity and code review metrics...")
    
    # Simulate data for individual developers
    developer_data = {
        "Alice": {
            "commits_last_month": 120,
            "lines_of_code_added": 3500,
            "pull_requests_opened": 15,
            "pull_requests_reviewed": 20,
            "avg_pr_cycle_time_hours": 18,
            "code_review_comments_given": 50,
            "code_review_comments_received": 30,
            "test_coverage_contribution": 0.85, # Proportion of their code covered by tests
        },
        "Bob": {
            "commits_last_month": 90,
            "lines_of_code_added": 2800,
            "pull_requests_opened": 12,
            "pull_requests_reviewed": 18,
            "avg_pr_cycle_time_hours": 24,
            "code_review_comments_given": 40,
            "code_review_comments_received": 45,
            "test_coverage_contribution": 0.70,
        },
        "Charlie": {
            "commits_last_month": 150,
            "lines_of_code_added": 4200,
            "pull_requests_opened": 20,
            "pull_requests_reviewed": 10,
            "avg_pr_cycle_time_hours": 15,
            "code_review_comments_given": 25,
            "code_review_comments_received": 60,
            "test_coverage_contribution": 0.90,
        },
    }
    
    # Simulate team-level metrics
    team_data = {
        "total_prs_merged": 150,
        "avg_pr_merge_time_hours": 20,
        "avg_code_review_time_hours": 8,
        "bug_density_per_kloc": 5.2, # Bugs per 1000 lines of code
        "critical_bugs_last_month": 3,
        "on_call_incidents_last_month": 5,
    }
    
    return {"developers": developer_data, "team": team_data}

# --- 2. Productivity & Engagement Analysis ---
def analyze_productivity_insights(metrics_data):
    """
    Analyzes developer metrics to identify productivity trends, potential burnout risks,
    and areas for team improvement.
    """
    print("Analyzing developer productivity and engagement...")
    insights = []

    # Insight 1: Identify developers with high commit count but low review activity (potential silo)
    for dev, data in metrics_data["developers"].items():
        if data["commits_last_month"] > 100 and data["pull_requests_reviewed"] < 15:
            insights.append({
                "finding": f"Developer `{dev}` has high commit activity but lower code review participation. This might indicate a potential knowledge silo or an opportunity for more cross-team collaboration.",
                "recommendation": "Encourage `{dev}` to participate more in code reviews, perhaps by assigning them to PRs from other teams. Ensure workload is balanced.",
                "severity": "medium",
            })

    # Insight 2: Identify high PR cycle time (bottleneck in review process)
    if metrics_data["team"]["avg_pr_cycle_time_hours"] > 20:
        insights.append({
            "finding": f"Average Pull Request (PR) cycle time is {metrics_data['team']['avg_pr_cycle_time_hours']} hours, which is higher than the target of 20 hours. This indicates a bottleneck in the code review or merge process.",
            "recommendation": "Investigate reasons for long PR cycle times. This could be due to large PRs, insufficient reviewers, or slow review feedback. Consider implementing smaller, more frequent PRs.",
            "severity": "high",
        })

    # Insight 3: Identify developers with high received comments (potential coaching opportunity)
    for dev, data in metrics_data["developers"].items():
        if data["code_review_comments_received"] > data["code_review_comments_given"] * 1.5:
            insights.append({
                "finding": f"Developer `{dev}` receives significantly more code review comments than they give. This might indicate a need for additional coaching or training in specific areas.",
                "recommendation": "Provide targeted training or mentorship to `{dev}` on coding standards, design patterns, or specific technical areas. Encourage them to review more code to learn from others.",
                "severity": "low",
            })
            
    return insights

# --- 3. Report Generation ---
def generate_chro_dashboard(metrics_data, productivity_insights):
    """
    Generates a comprehensive CHRO dashboard in Markdown format.
    """
    print("Generating CHRO Engineering Team & Developer Productivity Report...")
    report_path = REPORTS_DIR / f"chro_dashboard_{datetime.now().strftime('%Y-%m-%d')}.md"
    
    with open(report_path, "w") as f:
        f.write(f"# Meqenet.et - CHRO Engineering Team & Developer Productivity Report\n")
        f.write(f"_Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}_\n\n")
        f.write("This report provides insights into the productivity, collaboration, and overall health of the engineering team, supporting strategic HR initiatives.\n")

        # --- Team-Level Metrics Section ---
        f.write("\n## 1. Team-Level Productivity Overview\n")
        team = metrics_data["team"]
        f.write(f"- **Total PRs Merged Last Month:** {team['total_prs_merged']}\n")
        f.write(f"- **Average PR Merge Time:** {team['avg_pr_merge_time_hours']} hours\n")
        f.write(f"- **Average Code Review Time:** {team['avg_code_review_time_hours']} hours\n")
        f.write(f"- **Bug Density (per 1k LOC):** {team['bug_density_per_kloc']}\n")
        f.write(f"- **Critical Bugs Last Month:** {team['critical_bugs_last_month']}\n")
        f.write(f"- **On-Call Incidents Last Month:** {team['on_call_incidents_last_month']}\n")

        # --- Individual Developer Metrics Section ---
        f.write("\n## 2. Individual Developer Contributions\n")
        if metrics_data["developers"]:
            f.write("| Developer | Commits | LOC Added | PRs Opened | PRs Reviewed | Avg PR Cycle (hrs) | Test Coverage Contrib. | Review Comments Given | Review Comments Received |\n")
            f.write("|-----------|---------|-----------|------------|--------------|--------------------|------------------------|-----------------------|--------------------------|\n")
            for dev, data in metrics_data["developers"].items():
                f.write(f"| `{dev}` | {data['commits_last_month']} | {data['lines_of_code_added']} | {data['pull_requests_opened']} | {data['pull_requests_reviewed']} | {data['avg_pr_cycle_time_hours']} | {data['test_coverage_contribution']:.2f} | {data['code_review_comments_given']} | {data['code_review_comments_received']} |\n")
        else:
            f.write("No individual developer data available.\n")

        # --- Productivity Insights Section ---
        f.write("\n## 3. Productivity & Engagement Insights\n")
        if productivity_insights:
            f.write(f"**Summary:** Identified `{len(productivity_insights)}` key insights for team health and productivity.\n\n")
            for insight in productivity_insights:
                f.write(f"- **Severity:** {insight['severity'].capitalize()}\n")
                f.write(f"  - **Finding:** {insight['finding']}\n")
                f.write(f"  - **Recommendation:** {insight['recommendation']}\n")
        else:
            f.write("✅ **No specific productivity insights identified in this run.**\n")

    print(f"Report successfully generated at: {report_path}")
    return report_path

def main():
    """
    Main function to run the CHRO dashboard generation process.
    """
    print("--- Starting CHRO Engineering Team & Developer Productivity Analysis ---")
    
    developer_metrics = fetch_developer_metrics()
    productivity_insights = analyze_productivity_insights(developer_metrics)
    
    generate_chro_dashboard(
        developer_metrics,
        productivity_insights
    )
    
    print("\n--- CHRO Engineering Team & Developer Productivity Analysis Finished ---")

if __name__ == "__main__":
    main()
