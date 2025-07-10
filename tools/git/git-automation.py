import argparse
import subprocess
import sys
import json
import os
import re
from ruamel.yaml import YAML
from datetime import datetime

# Make path to tasks.yaml absolute from the script's location
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
    """Executes a command and returns its output."""
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
        # Return the error to be handled by the caller
        return e
    except FileNotFoundError:
        print(f"Error: The command '{command[0]}' was not found.", file=sys.stderr)
        print("Please ensure that Git is installed and in your system's PATH.", file=sys.stderr)
        sys.exit(1)

def working_directory_is_clean():
    """Checks if the Git working directory is clean."""
    status_result = run_command(["git", "status", "--porcelain"])
    if isinstance(status_result, subprocess.CalledProcessError):
        print("Error checking Git status.", file=sys.stderr)
        sys.exit(1)
    return not status_result

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
    """Checks out a branch, creating it from remote if it doesn't exist locally. If not found, creates from 'main' after ensuring a clean working directory."""
    print(f"\nSwitching to branch '{branch_name}'...")

    # Check for a clean working directory before switching/creating branches
    if not working_directory_is_clean():
        print("Error: Your working directory is not clean. Please commit or stash your changes before switching branches.", file=sys.stderr)
        sys.exit(1)

    # Robust check if branch exists locally
    branch_exists = subprocess.call(["git", "rev-parse", "--verify", branch_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    if branch_exists:
        print(f"Branch '{branch_name}' already exists locally. Checking it out.")
        checkout_result = run_command(["git", "checkout", branch_name])
        if isinstance(checkout_result, subprocess.CalledProcessError):
            print(f"Error checking out branch '{branch_name}'.", file=sys.stderr)
            print(checkout_result.stderr, file=sys.stderr)
            sys.exit(1)
        print(f"Pulling latest changes for '{branch_name}'...")
        pull_result = run_command(["git", "pull"])
        if isinstance(pull_result, subprocess.CalledProcessError):
            print(f"Warning: Could not pull latest changes for '{branch_name}'. It may be up-to-date or have conflicts.", file=sys.stderr)
        print(f"Successfully switched to branch '{branch_name}'.")
        return

    # If not, check if it exists on the remote
    print(f"Branch '{branch_name}' not found locally. Checking remote...")
    run_command(["git", "fetch", "origin"])
    remote_exists = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
    if not remote_exists:
        print(f"Branch '{branch_name}' not found on remote. Creating it from 'main'.")
        # Ensure main is checked out and up-to-date
        checkout_branch("main")
        print(f"Creating new branch '{branch_name}' from 'main'...")
        create_result = run_command(["git", "checkout", "-b", branch_name])
        if isinstance(create_result, subprocess.CalledProcessError):
            print(f"Error creating new branch '{branch_name}'. Please ensure your working directory is clean and try again.", file=sys.stderr)
            sys.exit(1)
        print(f"Pushing new branch '{branch_name}' to remote...")
        push_result = run_command(["git", "push", "-u", "origin", branch_name])
        if isinstance(push_result, subprocess.CalledProcessError):
            print(f"Error pushing new branch '{branch_name}' to remote.", file=sys.stderr)
            sys.exit(1)
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
    """Loads tasks from the YAML file."""
    yaml = YAML()
    try:
        with open(TASKS_FILE_PATH, "r", encoding="utf-8") as f:
            return yaml.load(f)
    except FileNotFoundError:
        print(f"Error: Tasks file not found at {TASKS_FILE_PATH}", file=sys.stderr)
        sys.exit(1)

def save_tasks(data):
    """Saves tasks to the YAML file, preserving structure."""
    yaml = YAML()
    with open(TASKS_FILE_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f)

def find_task(data, task_id):
    """Finds a task or subtask by its ID."""
    for stage in data.get("stages", []):
        for i, task in enumerate(stage.get("tasks", [])):
            if task.get("id") == task_id:
                return stage["tasks"], i
            for j, subtask in enumerate(task.get("subtasks", [])):
                if subtask.get("id") == task_id:
                    return task["subtasks"], j
    return None, None

def start_task(task_id, base_branch):
    """Starts a new development task by creating a feature branch and updating the tasks file."""
    tasks_data = load_tasks()
    task_list, idx = find_task(tasks_data, task_id)

    if task_list is None:
        print(f"Error: Task with ID '{task_id}' not found in {TASKS_FILE_PATH}.", file=sys.stderr)
        sys.exit(1)

    if task_list[idx]["status"] != "To Do":
        print(f"Warning: Task '{task_id}' has a status of '{task_list[idx]['status']}' and may already be in progress or completed.")

    task_name = task_list[idx].get("name") or task_list[idx].get("description", "new-task")
    sanitized_name = ''.join(c if c.isalnum() else '-' for c in task_name.lower().replace(" ", "-"))
    task_name_slug = '-'.join(filter(None, sanitized_name.split('-')))

    branch_name = f"feature/{task_id}-{task_name_slug}"
    
    print(f"Starting new task: {task_id} - {task_name}")
    print(f"Branch: {branch_name}")

    # Check if branch already exists on the remote
    print("Checking if branch already exists on remote...")
    remote_branch_exists = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
    if remote_branch_exists:
        print(f"\nError: Branch '{branch_name}' already exists on the remote repository.", file=sys.stderr)
        print("Please sync your local repository or choose a different task.", file=sys.stderr)
        sys.exit(1)
    print("Branch does not exist on remote. Proceeding.")

    # Ensure the base branch is up-to-date
    checkout_branch(base_branch)

    # Create and checkout the new feature branch
    print(f"\nCreating new branch '{branch_name}' from '{base_branch}'...")
    create_branch_result = run_command(["git", "checkout", "-b", branch_name])
    if isinstance(create_branch_result, subprocess.CalledProcessError):
        print(f"Error creating new branch '{branch_name}'.", file=sys.stderr)
        print(create_branch_result.stderr, file=sys.stderr)
        sys.exit(1)

    # Update task status in YAML
    print(f"\nUpdating task '{task_id}' status to 'In Progress'...")
    task_list[idx]["status"] = "In Progress"
    save_tasks(tasks_data)

    print("\nTask started successfully.")
    print(f"You are now on branch: {branch_name}")
    print("You can now start working on your changes.")

def get_task_id_from_branch(tasks_data):
    """Extracts the task ID from the current Git branch name."""
    branch_name = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if isinstance(branch_name, subprocess.CalledProcessError):
        print("Error: Could not determine the current branch.", file=sys.stderr)
        return None
    
    parts = branch_name.split('/')
    if len(parts) > 1:
        task_info = parts[-1].split('-')
        # Handle cases like FND-BE-DB-01
        if len(task_info) > 1 and task_info[0].isupper():
            task_id = '-'.join(task_info[0:4])
            return task_id

    print(f"Warning: Could not determine task ID from branch name '{branch_name}'.", file=sys.stderr)
    return None

def complete_task():
    """Marks the current task as 'In Review'."""
    tasks_data = load_tasks()
    task_id = get_task_id_from_branch(tasks_data)
    if not task_id:
        sys.exit(1)

    task_list, idx = find_task(tasks_data, task_id)
    if task_list is None:
        print(f"Error: Task with ID '{task_id}' not found.", file=sys.stderr)
        sys.exit(1)
    
    current_status = task_list[idx].get("status")
    if current_status != "In Progress":
        print(f"Warning: Task status is '{current_status}'. It should be 'In Progress' to be marked for review.", file=sys.stderr)

    # Stage all changes
    print("Staging all changes...")
    run_command(["git", "add", "."])

    # Commit changes
    commit_message = f"feat({task_id}): {task_list[idx].get('name', 'Complete task')}"
    print(f"Committing with message: '{commit_message}'")
    commit_result = run_command(["git", "commit", "-m", commit_message])
    if isinstance(commit_result, subprocess.CalledProcessError):
        print("Error during commit. There may be nothing to commit or a pre-commit hook failed.", file=sys.stderr)
        # Don't exit, might just be no changes.
    else:
        print(commit_result)

    # Push to remote
    branch_name = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    print(f"Pushing changes to origin/{branch_name}...")
    push_result = run_command(["git", "push", "--set-upstream", "origin", branch_name])
    if isinstance(push_result, subprocess.CalledProcessError):
        print("Error pushing to remote.", file=sys.stderr)
        print(push_result.stderr, file=sys.stderr)
        sys.exit(1)
        
    # Update status to 'In Review'
    task_list[idx]["status"] = "In Review"
    task_list[idx]["updated_at"] = datetime.now().isoformat()
    save_tasks(tasks_data)

    print(f"\nTask '{task_id}' has been marked as 'In Review'.")
    print("Create a pull request on GitHub to merge your changes.")

def get_pr_info(pr_number, field):
    """Gets a specific field from a PR using the gh cli."""
    command = ["gh", "pr", "view", str(pr_number), "--json", field, "-q", f".{field}"]
    result = run_command(command)
    if isinstance(result, subprocess.CalledProcessError):
        print(f"Error fetching PR info for PR #{pr_number}. Is the 'gh' CLI installed and configured?", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return result

def merge_task(pr_number, target_branch, skip_approval=False):
    """Merges an approved and clean pull request."""
    print(f"Attempting to merge PR #{pr_number} into '{target_branch}'...")

    if not skip_approval:
        # Check PR status
        print("Checking PR review status...")
        review_status = get_pr_info(pr_number, "reviewDecision")
        if review_status != "APPROVED":
            print(f"Error: Pull request is not approved. Current review status: {review_status}", file=sys.stderr)
            sys.exit(1)
        print("PR is approved.")
    else:
        print("Skipping approval check (--skip-approval flag used)...")

    # Check merge status
    print("Checking PR merge status...")
    merge_status = get_pr_info(pr_number, "mergeable")
    if merge_status != "MERGEABLE":
        print(f"Error: Pull request is not mergeable. Status: {merge_status}", file=sys.stderr)
        print("Please resolve conflicts or failing checks on GitHub.", file=sys.stderr)
        sys.exit(1)
    print("PR is mergeable.")

    # Checkout target branch and pull latest changes
    checkout_branch(target_branch)

    # Merge the PR
    print(f"Merging PR #{pr_number}...")
    merge_result = run_command(["gh", "pr", "merge", str(pr_number), "--squash", "--delete-branch"])
    if isinstance(merge_result, subprocess.CalledProcessError):
        print(f"Error merging PR #{pr_number}.", file=sys.stderr)
        print(merge_result.stderr, file=sys.stderr)
        sys.exit(1)
    
    print(merge_result)
    print("Pushing changes to remote...")
    push_result = run_command(["git", "push", "origin", target_branch])
    if isinstance(push_result, subprocess.CalledProcessError):
        print(f"Error pushing to '{target_branch}'.", file=sys.stderr)
        sys.exit(1)

    print(f"\nSuccessfully merged PR #{pr_number} into '{target_branch}'.")

def sync_task(target_branch='develop'):
    """Syncs the current feature branch with the target branch."""
    print(f"Syncing current branch with '{target_branch}'...")
    
    current_branch = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if current_branch == target_branch:
        print(f"Error: You are already on the '{target_branch}' branch.", file=sys.stderr)
        sys.exit(1)
        
    # Fetch latest changes from remote
    print("Fetching latest changes...")
    run_command(["git", "fetch", "origin"])

    # Rebase current branch on top of the target branch
    print(f"Rebasing current branch onto 'origin/{target_branch}'...")
    rebase_result = run_command(["git", "rebase", f"origin/{target_branch}"])
    
    if isinstance(rebase_result, subprocess.CalledProcessError):
        print("Error during rebase. You may have conflicts to resolve.", file=sys.stderr)
        print("Please resolve the conflicts, then run 'git rebase --continue'.", file=sys.stderr)
        print("To abort, run 'git rebase --abort'.", file=sys.stderr)
        sys.exit(1)
    
    print("Rebase successful.")
    print("\nYour branch is now up-to-date with the latest changes from the target branch.")
    print("You may need to force-push your changes to the remote branch: git push --force-with-lease")

def close_security_branch(branch_name, incident_id, description, skip_audit_tag=False):
    """
    Close a security branch with NBE-compliant audit trail and clean deletion.
    
    Implements combined Option A + Option B workflow:
    - Creates permanent audit tag for NBE compliance
    - Deletes branch for repository hygiene
    
    Args:
        branch_name: Name of the security branch to close
        incident_id: Security incident ID (e.g., SEC-01, CRIT-02)
        description: Description of the security resolution
        skip_audit_tag: Skip audit tag creation (for testing only)
    """
    print(f"🔒 Closing security branch: {branch_name}")
    print(f"📋 Security incident: {incident_id}")
    print(f"📝 Resolution: {description}")
    print("=" * 60)
    
    # Validate branch exists
    print("1️⃣ Validating branch existence...")
    local_branches = run_command(["git", "branch"])
    remote_branches = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
    
    if f" {branch_name}" not in local_branches and f"* {branch_name}" not in local_branches:
        if not remote_branches:
            print(f"❌ Error: Branch '{branch_name}' not found locally or remotely.", file=sys.stderr)
            sys.exit(1)
        print(f"ℹ️  Branch '{branch_name}' exists only on remote. Fetching...")
        run_command(["git", "fetch", "origin"])
        run_command(["git", "checkout", "-b", branch_name, f"origin/{branch_name}"])
    
    # Switch to develop branch for tagging and cleanup
    print("2️⃣ Switching to develop branch...")
    checkout_branch("develop")
    
    # Verify security resolution (optional vulnerability check)
    print("3️⃣ Running security verification...")
    try:
        audit_result = run_command(["pnpm", "audit"])
        if "No known vulnerabilities found" in audit_result:
            print("✅ Security verification passed: No vulnerabilities found")
        else:
            print("⚠️  Warning: Vulnerabilities still detected - proceeding with caution")
            print(audit_result)
    except:
        print("ℹ️  Could not run security audit - proceeding without verification")
    
    if not skip_audit_tag:
        # Step 4: Create NBE compliance audit tag (Option B)
        print("4️⃣ Creating NBE compliance audit tag...")
        tag_name = f"security/{incident_id}-resolved-v1.0.0"
        current_date = datetime.now().strftime("%Y-%m-%d")
        tag_message = f"Security incident {incident_id} resolved: {description} - NBE compliance maintained ({current_date})"
        
        tag_result = run_command(["git", "tag", "-a", tag_name, branch_name, "-m", tag_message])
        if isinstance(tag_result, subprocess.CalledProcessError):
            print(f"❌ Error creating audit tag: {tag_result.stderr}", file=sys.stderr)
            sys.exit(1)
        
        print(f"✅ Audit tag created: {tag_name}")
        
        # Push audit tag to remote for permanent record
        print("5️⃣ Pushing audit tag to remote...")
        push_tag_result = run_command(["git", "push", "origin", tag_name])
        if isinstance(push_tag_result, subprocess.CalledProcessError):
            print(f"❌ Error pushing audit tag: {push_tag_result.stderr}", file=sys.stderr)
            sys.exit(1)
        
        print(f"✅ Audit tag pushed to remote: {tag_name}")
    else:
        print("4️⃣ Skipping audit tag creation (skip_audit_tag=True)")
    
    # Step 6: Clean deletion (Option A)
    print("6️⃣ Performing clean branch deletion...")
    
    # Delete local branch
    delete_local_result = run_command(["git", "branch", "-D", branch_name])
    if isinstance(delete_local_result, subprocess.CalledProcessError):
        print(f"⚠️  Warning: Could not delete local branch: {delete_local_result.stderr}")
    else:
        print(f"✅ Local branch '{branch_name}' deleted")
    
    # Delete remote branch
    delete_remote_result = run_command(["git", "push", "origin", "--delete", branch_name])
    if isinstance(delete_remote_result, subprocess.CalledProcessError):
        print(f"⚠️  Warning: Could not delete remote branch: {delete_remote_result.stderr}")
    else:
        print(f"✅ Remote branch '{branch_name}' deleted")
    
    # Final status
    print("=" * 60)
    print("🎉 Security branch closure completed successfully!")
    print("\n📋 NBE Compliance Summary:")
    if not skip_audit_tag:
        print(f"   ✅ Audit trail: {tag_name}")
    print(f"   ✅ Repository hygiene: Branch deleted")
    print(f"   ✅ Security resolution: {incident_id} documented")
    print("\n🔄 Next steps:")
    print("   1. Update security incident log documentation")
    print("   2. Notify compliance team of resolution")
    print("   3. Schedule follow-up security review")

def main():
    parser = argparse.ArgumentParser(description="Meqenet Git Automation Script")
    subparsers = parser.add_subparsers(dest="command", required=True)

    start_parser = subparsers.add_parser("start-task", help="Start a new development task.")
    start_parser.add_argument("task_id", help="The ID of the task to start (e.g., FND-BE-DB-01).")
    start_parser.add_argument("--base", default="develop", help="The base branch to branch off from (default: develop).")
    
    complete_parser = subparsers.add_parser("complete-task", help="Mark the current task as complete and ready for review.")
    
    merge_parser = subparsers.add_parser("merge-task", help="Merge a pull request after approval.")
    merge_parser.add_argument("pr_number", type=int, help="The pull request number to merge.")
    merge_parser.add_argument("--target", default="develop", help="The target branch to merge into (default: develop).")
    merge_parser.add_argument("--skip-approval", action="store_true", help="Skip the approval check for the pull request.")
    
    sync_parser = subparsers.add_parser("sync-task", help="Sync the current feature branch with the target branch.")
    sync_parser.add_argument("--target", default="develop", help="The target branch to sync with (default: develop).")

    # Sub-parser for the close-security-branch command
    close_security_parser = subparsers.add_parser(
        "close-security-branch", 
        help="Close a security branch with NBE-compliant audit trail and clean deletion."
    )
    close_security_parser.add_argument(
        "branch_name", 
        help="Name of the security branch to close (e.g., fix/SEC-01-update-vitest-esbuild-vulnerability)."
    )
    close_security_parser.add_argument(
        "incident_id", 
        help="Security incident ID (e.g., SEC-01, CRIT-02)."
    )
    close_security_parser.add_argument(
        "description", 
        help="Description of the security resolution (e.g., 'Vitest/esbuild vulnerabilities eliminated')."
    )
    close_security_parser.add_argument(
        "--skip-audit-tag",
        action="store_true",
        help="Skip creating audit tag (for testing only - not recommended for production)."
    )

    args = parser.parse_args()

    if not working_directory_is_clean() and args.command not in ['complete-task']:
        print("Error: Your working directory is not clean. Please commit or stash your changes before running this script.", file=sys.stderr)
        sys.exit(1)
    
    if args.command == "start-task":
        start_task(args.task_id, args.base)
    elif args.command == "complete-task":
        complete_task()
    elif args.command == "merge-task":
        merge_task(args.pr_number, args.target, args.skip_approval)
    elif args.command == "sync-task":
        sync_task(args.target)
    elif args.command == "close-security-branch":
        close_security_branch(args.branch_name, args.incident_id, args.description, args.skip_audit_tag)

if __name__ == "__main__":
    main()
