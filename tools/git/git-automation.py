import argparse
import subprocess
import sys
import json
import os
import re
from ruamel.yaml import YAML
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
TASKS_FILE_PATH = os.path.join(PROJECT_ROOT, "tasks", "tasks.yaml")

# Fintech branching strategy enforcement
ALLOWED_BRANCH_PATTERNS = {
    'feature': r'^feature/[A-Z]+-[A-Z]+-[A-Z]+-\d+-[a-z0-9-]+$',
    'hotfix': r'^hotfix/(SEC|CRIT)-\d+-[a-z0-9-]+$',
    'bugfix': r'^bugfix/BUG-\d+-[a-z0-9-]+$',
    'release': r'^release/v\d+\.\d+\.\d+$'
}

FINTECH_BASE_BRANCHES = {
    'feature': 'develop',
    'bugfix': 'develop',
    'hotfix': 'main',  # Security hotfixes start from production
    'release': 'develop'
}

def run_command(command):
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            encoding='utf-8',
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return e
    except FileNotFoundError:
        print(f"Error: The command '{command[0]}' was not found.", file=sys.stderr)
        print("Please ensure that Git is installed and in your system's PATH.", file=sys.stderr)
        sys.exit(1)

def validate_branch_name(branch_name):
    """Validate branch name against fintech branching strategy."""
    branch_type = branch_name.split('/')[0]
    
    if branch_type not in ALLOWED_BRANCH_PATTERNS:
        print(f"Error: Invalid branch type '{branch_type}'.", file=sys.stderr)
        print(f"Allowed types: {', '.join(ALLOWED_BRANCH_PATTERNS.keys())}", file=sys.stderr)
        return False
    
    pattern = ALLOWED_BRANCH_PATTERNS[branch_type]
    if not re.match(pattern, branch_name):
        print(f"Error: Branch name '{branch_name}' doesn't match required pattern.", file=sys.stderr)
        print(f"Required pattern for {branch_type}: {pattern}", file=sys.stderr)
        print(f"Example: {get_branch_example(branch_type)}", file=sys.stderr)
        return False
    
    return True

def get_branch_example(branch_type):
    """Get example branch name for each type."""
    examples = {
        'feature': 'feature/FND-BE-AUTH-01-implement-fayda-verification',
        'hotfix': 'hotfix/SEC-01-fix-authentication-vulnerability',
        'bugfix': 'bugfix/BUG-01-fix-user-profile-validation',
        'release': 'release/v1.2.0'
    }
    return examples.get(branch_type, 'N/A')

def checkout_branch(branch_name):
    print(f"\nSwitching to branch '{branch_name}'...")
    local_branches = run_command(["git", "branch"])
    if f" {branch_name}" in local_branches or f"* {branch_name}" in local_branches:
        print(f"Branch '{branch_name}' already exists locally. Checking it out.")
        checkout_result = run_command(["git", "checkout", branch_name])
    else:
        print(f"Branch '{branch_name}' not found locally. Checking remote...")
        run_command(["git", "fetch", "origin"])
        remote_exists = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
        if not remote_exists:
            # For fintech strategy, determine the correct base branch
            branch_type = branch_name.split('/')[0]
            base_branch = FINTECH_BASE_BRANCHES.get(branch_type, 'develop')
            print(f"Branch '{branch_name}' not found on remote. Creating it from '{base_branch}'.")
            checkout_branch(base_branch)
            print(f"Creating new branch '{branch_name}' from '{base_branch}'...")
            checkout_result = run_command(["git", "checkout", "-b", branch_name])
            if isinstance(checkout_result, subprocess.CalledProcessError):
                print(f"Error creating new branch '{branch_name}'. Exiting.", file=sys.stderr)
                sys.exit(1)
            print(f"Pushing new branch '{branch_name}' to remote...")
            run_command(["git", "push", "-u", "origin", branch_name])
            return
        print(f"Creating local branch '{branch_name}' from 'origin/{branch_name}'...")
        checkout_result = run_command(["git", "checkout", "-b", branch_name, f"origin/{branch_name}"])
    if isinstance(checkout_result, subprocess.CalledProcessError):
        print(f"Error checking out branch '{branch_name}'.", file=sys.stderr)
        print(checkout_result.stderr, file=sys.stderr)
        sys.exit(1)
    print(f"Pulling latest changes for '{branch_name}'...")
    pull_result = run_command(["git", "pull"])
    if isinstance(pull_result, subprocess.CalledProcessError):
        print(f"Warning: Could not pull latest changes for '{branch_name}'. It may be up-to-date or have conflicts.", file=sys.stderr)
    print(f"Successfully switched to branch '{branch_name}'.")

def load_tasks():
    yaml = YAML()
    with open(TASKS_FILE_PATH, "r", encoding="utf-8") as f:
        return yaml.load(f)

def save_tasks(data):
    yaml = YAML()
    with open(TASKS_FILE_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f)

def find_task(data, task_id):
    for stage in data.get("stages", []):
        for task in stage.get("tasks", []):
            if task.get("id") == task_id:
                return task
            for subtask in task.get("subtasks", []):
                if subtask.get("id") == task_id:
                    return subtask
    return None

def start_task(task_id, base_branch):
    tasks_data = load_tasks()
    task = find_task(tasks_data, task_id)
    if not task:
        print(f"Error: Task with ID '{task_id}' not found in {TASKS_FILE_PATH}.", file=sys.stderr)
        sys.exit(1)
    if task.get("status") != "To Do":
        print(f"Warning: Task '{task_id}' has a status of '{task.get('status')}' and may already be in progress or completed.")
    task_name = task.get("name") or task.get("description", "new-task")
    sanitized_name = ''.join(c if c.isalnum() else '-' for c in task_name.lower().replace(" ", "-"))
    task_name_slug = '-'.join(filter(None, sanitized_name.split('-')))
    branch_name = f"feature/{task_id}-{task_name_slug}"
    
    print(f"Starting new task: {task_id} - {task_name}")
    print(f"Branch: {branch_name}")

    # 0. Check if branch already exists on the remote
    print("Checking if branch already exists on remote...")
    remote_branch_exists = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
    if remote_branch_exists:
        print(f"\nError: Branch '{branch_name}' already exists on the remote repository.", file=sys.stderr)
        print("Please sync your local repository or choose a different task.", file=sys.stderr)
        sys.exit(1)
    print("Branch does not exist on remote. Proceeding.")

    # 1. Ensure the base branch is up-to-date
    checkout_branch(base_branch)

    # 2. Create and checkout the new feature branch, or check it out if it already exists
    feature_branch_exists = subprocess.call(["git", "rev-parse", "--verify", branch_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    if feature_branch_exists:
        print(f"Feature branch '{branch_name}' already exists locally. Checking it out.")
        run_command(["git", "checkout", branch_name])
        print(f"Pulling latest changes for '{branch_name}'...")
        run_command(["git", "pull"])
        print(f"Successfully switched to branch '{branch_name}'.")
    else:
        print(f"\nCreating new branch '{branch_name}' from '{base_branch}'...")
        create_branch_result = run_command(["git", "checkout", "-b", branch_name])
        if isinstance(create_branch_result, subprocess.CalledProcessError):
            print(f"Error creating new branch '{branch_name}'.", file=sys.stderr)
            print(create_branch_result.stderr, file=sys.stderr)
            sys.exit(1)

    print(f"\nUpdating task '{task_id}' status to 'In Progress'...")
    task["status"] = "In Progress"
    save_tasks(tasks_data)
    print("\nTask started successfully.")
    print(f"You are now on branch: {branch_name}")
    print("You can now start working on your changes.")

def start_hotfix(hotfix_id, description, base_branch="main", severity="SEC"):
    """Start a new security or critical hotfix following fintech standards."""
    if severity not in ["SEC", "CRIT"]:
        print(f"Error: Severity must be either 'SEC' (Security) or 'CRIT' (Critical).", file=sys.stderr)
        sys.exit(1)
    
    # Sanitize description for branch name
    sanitized_desc = ''.join(c if c.isalnum() else '-' for c in description.lower().replace(" ", "-"))
    desc_slug = '-'.join(filter(None, sanitized_desc.split('-')))
    
    branch_name = f"hotfix/{severity}-{hotfix_id}-{desc_slug}"
    
    # Validate branch name against fintech standards
    if not validate_branch_name(branch_name):
        sys.exit(1)
    
    print(f"🚨 Starting {severity} hotfix: {hotfix_id} - {description}")
    print(f"Branch: {branch_name}")
    print(f"Base: {base_branch} (fintech standard for hotfixes)")

    # Check if branch already exists on the remote
    print("Checking if branch already exists on remote...")
    remote_branch_exists = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
    if remote_branch_exists:
        print(f"\nError: Branch '{branch_name}' already exists on the remote repository.", file=sys.stderr)
        sys.exit(1)
    
    # Ensure the base branch is up-to-date
    checkout_branch(base_branch)
    
    # Create and checkout the new hotfix branch
    print(f"\nCreating new hotfix branch '{branch_name}' from '{base_branch}'...")
    create_branch_result = run_command(["git", "checkout", "-b", branch_name])
    if isinstance(create_branch_result, subprocess.CalledProcessError):
        print(f"Error creating new branch '{branch_name}'.", file=sys.stderr)
        sys.exit(1)
    
    print(f"\n🔧 Hotfix branch created successfully.")
    print(f"You are now on branch: {branch_name}")
    print("\n⚠️  SECURITY REMINDER:")
    print("1. Apply the minimal viable fix")
    print("2. This hotfix will need to be merged to both 'main' and 'develop'")
    print("3. Ensure thorough security review before deployment")
    print("4. Document the fix in commit messages for audit compliance")

def main():
    # First, check if the repository is clean
    git_status = run_command(["git", "status", "--porcelain"])
    if git_status:
        print("Error: Your working directory is not clean. There are uncommitted changes.", file=sys.stderr)
        print("Please commit or stash your changes before running the automation script.", file=sys.stderr)
        print("\nUncommitted changes:\n" + git_status, file=sys.stderr)
        sys.exit(1)

    parser = argparse.ArgumentParser(
        description="Meqenet Git Automation Tool for enterprise-grade fintech workflows."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Sub-parser for the start-task command
    start_parser = subparsers.add_parser(
        "start-task", help="Start a new development task following fintech branching strategy."
    )
    start_parser.add_argument("task_id", help="The unique identifier for the task from tasks.yaml (e.g., FND-BE-DB-01).")
    start_parser.add_argument(
        "--base-branch",
        default="develop",
        help="The base branch to create the feature branch from. Defaults to 'develop' for fintech compliance.",
    )

    # Sub-parser for the start-hotfix command
    hotfix_parser = subparsers.add_parser(
        "start-hotfix", help="Start a security or critical hotfix following fintech emergency procedures."
    )
    hotfix_parser.add_argument("hotfix_id", help="The unique identifier for the hotfix (e.g., 01, 02, 03).")
    hotfix_parser.add_argument("description", help="Brief description of the hotfix.")
    hotfix_parser.add_argument(
        "--severity",
        choices=["SEC", "CRIT"],
        default="SEC",
        help="Severity level: SEC (Security) or CRIT (Critical). Defaults to SEC.",
    )
    hotfix_parser.add_argument(
        "--base-branch",
        default="main",
        help="The base branch to create the hotfix from. Defaults to 'main' for production hotfixes.",
    )

    args = parser.parse_args()

    if args.command == "start-task":
        start_task(args.task_id, args.base_branch)
    elif args.command == "start-hotfix":
        start_hotfix(args.hotfix_id, args.description, args.base_branch, args.severity)
    # (Other command dispatches would go here)

if __name__ == "__main__":
    main()

# ... (rest of the script with all robust logic and commands) ... 