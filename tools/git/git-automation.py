import argparse
import subprocess
import sys
import json
import os
from ruamel.yaml import YAML
from datetime import datetime

# Make path to tasks.yaml absolute from the script's location
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
TASKS_FILE_PATH = os.path.join(PROJECT_ROOT, "tasks", "tasks.yaml")

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

def checkout_branch(branch_name):
    """Checks out a branch, creating it from remote if it doesn't exist locally."""
    print(f"\nSwitching to branch '{branch_name}'...")
    
    # Check if branch exists locally
    local_branches = run_command(["git", "branch"])
    if f" {branch_name}" in local_branches or f"* {branch_name}" in local_branches:
        print(f"Branch '{branch_name}' already exists locally. Checking it out.")
        checkout_result = run_command(["git", "checkout", branch_name])
    else:
        # If not, check if it exists on the remote
        print(f"Branch '{branch_name}' not found locally. Checking remote...")
        run_command(["git", "fetch", "origin"])
        remote_exists = run_command(["git", "ls-remote", "--heads", "origin", branch_name])
        if not remote_exists:
            print(f"Branch '{branch_name}' not found on remote. Creating it from 'main'.")
            checkout_branch("main") # Ensure main is checked out and up-to-date
            print(f"Creating new branch '{branch_name}' from 'main'...")
            checkout_result = run_command(["git", "checkout", "-b", branch_name])
            if isinstance(checkout_result, subprocess.CalledProcessError):
                 print(f"Error creating new branch '{branch_name}'. Exiting.", file=sys.stderr)
                 sys.exit(1)
            print(f"Pushing new branch '{branch_name}' to remote...")
            run_command(["git", "push", "-u", "origin", branch_name])
            return # The branch is now checked out, so we can exit the function
        
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
    with open(TASKS_FILE_PATH, "r", encoding="utf-8") as f:
        return yaml.load(f)

def save_tasks(data):
    """Saves tasks to the YAML file, preserving structure."""
    yaml = YAML()
    with open(TASKS_FILE_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f)

def find_task(data, task_id):
    """Finds a task by its ID in the YAML data."""
    for stage in data.get("stages", []):
        for task in stage.get("tasks", []):
            if task.get("id") == task_id:
                return task
            for subtask in task.get("subtasks", []):
                if subtask.get("id") == task_id:
                    return subtask
    return None

def start_task(task_id, base_branch):
    """
    Starts a new development task by creating a feature branch and updating the tasks file.
    """
    tasks_data = load_tasks()
    task = find_task(tasks_data, task_id)

    if not task:
        print(f"Error: Task with ID '{task_id}' not found in {TASKS_FILE_PATH}.", file=sys.stderr)
        sys.exit(1)

    if task.get("status") != "To Do":
        print(f"Warning: Task '{task_id}' has a status of '{task.get('status')}' and may already be in progress or completed.")
        # We can decide to exit here or just warn. For now, let's warn.

    task_name = task.get("name") or task.get("description", "new-task")
    # Sanitize the task name to be used in a branch
    sanitized_name = ''.join(c if c.isalnum() else '-' for c in task_name.lower().replace(" ", "-"))
    # Remove any consecutive dashes
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

    # 2. Create and checkout the new feature branch
    print(f"\nCreating new branch '{branch_name}' from '{base_branch}'...")
    create_branch_result = run_command(["git", "checkout", "-b", branch_name])
    if isinstance(create_branch_result, subprocess.CalledProcessError):
        print(f"Error creating new branch '{branch_name}'.", file=sys.stderr)
        print(create_branch_result.stderr, file=sys.stderr)
        sys.exit(1)

    # 3. Update task status in YAML
    print(f"\nUpdating task '{task_id}' status to 'In Progress'...")
    task["status"] = "In Progress"
    save_tasks(tasks_data)

    print("\nTask started successfully.")
    print(f"You are now on branch: {branch_name}")
    print("You can now start working on your changes.")

def get_task_id_from_branch(tasks_data):
    """Extracts the task ID from the current git branch name by matching against the tasks file."""
    current_branch = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if not current_branch.startswith("feature/"):
        print("Error: Current branch is not a feature branch.", file=sys.stderr)
        sys.exit(1)

    branch_slug = current_branch.split('/', 1)[1]
    
    all_task_ids = []
    for stage in tasks_data.get("stages", []):
        for task in stage.get("tasks", []):
            if task.get("id"):
                all_task_ids.append(task.get("id"))
            for subtask in task.get("subtasks", []):
                if subtask.get("id"):
                    all_task_ids.append(subtask.get("id"))
    
    # Find which task ID is the prefix of our branch slug
    for task_id in sorted(all_task_ids, key=len, reverse=True): # Sort by length to match longest first
        if branch_slug.startswith(task_id):
            return task_id

    print(f"Error: Could not extract a valid task ID from branch name '{current_branch}'.", file=sys.stderr)
    print("Please ensure you are on a branch created with the 'start-task' command.", file=sys.stderr)
    sys.exit(1)

def complete_task(reviewers=None, assignees=None, labels=None):
    """
    Completes a development task by formatting, linting, testing, committing,
    and creating a pull request.
    """
    print("Completing task...")

    tasks_data = load_tasks()
    task_id = get_task_id_from_branch(tasks_data)
    task = find_task(tasks_data, task_id)

    if not task:
        print(f"Error: Task with ID '{task_id}' not found in {TASKS_FILE_PATH}.", file=sys.stderr)
        sys.exit(1)

    task_name = task.get("name") or task.get("description", "new-task")
    commit_message = f"feat({task_id}): {task_name}"
    pr_title = f"Feat: {task_name}"
    pr_body = f"This PR implements the task: **{task_name}**.\n\nCloses {task_id}"

    # 1. Run quality checks
    print("\nStep 1: Running quality checks...")
    print("Running formatter (prettier)...")
    run_command(["pnpm", "run", "format:write"])
    print("Running linter (eslint)...")
    run_command(["pnpm", "run", "lint:fix"])
    print("Running tests (jest)...")
    run_command(["pnpm", "run", "test"])
    print("All quality checks passed successfully.")

    # 2. Stage and commit changes
    print("\nStep 2: Staging and committing changes...")
    run_command(["git", "add", "."])
    run_command(["git", "commit", "-m", commit_message])
    print(f"Committed with message: '{commit_message}'")

    # 3. Push changes to remote
    print("\nStep 3: Pushing changes to remote...")
    current_branch = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    push_output = run_command(["git", "push", "--set-upstream", "origin", current_branch])

    if isinstance(push_output, subprocess.CalledProcessError):
        print("\nError: Pushing to remote failed.", file=sys.stderr)
        print("Git Error:", file=sys.stderr)
        print(push_output.stderr, file=sys.stderr)
        print("Reverting local commit...", file=sys.stderr)
        run_command(["git", "reset", "HEAD~1"])
        sys.exit(1)

    print(f"Pushed branch '{current_branch}' to origin.")

    # 4. Create a pull request using GitHub CLI
    print("\nStep 4: Creating Pull Request...")
    try:
        run_command(["gh", "--version"])
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("Error: GitHub CLI ('gh') is not installed or not in your PATH.", file=sys.stderr)
        print("Please install it to use this feature: https://cli.github.com/", file=sys.stderr)
        sys.exit(1)

    try:
        run_command(["gh", "auth", "status"])
    except subprocess.CalledProcessError:
        print("Error: Not authenticated with GitHub CLI ('gh').", file=sys.stderr)
        print("Please run 'gh auth login' to authenticate.", file=sys.stderr)
        sys.exit(1)

    gh_command = ["gh", "pr", "create", "--title", pr_title, "--body", pr_body, "--base", "develop", "--head", current_branch]

    if reviewers:
        gh_command.extend(["--reviewer", ",".join(reviewers)])
    
    if assignees:
        gh_command.extend(["--assignee", ",".join(assignees)])
        
    if labels:
        gh_command.extend(["--label", ",".join(labels)])
    
    print(f"Running command: {' '.join(gh_command)}")
    pr_output = run_command(gh_command)

    if isinstance(pr_output, subprocess.CalledProcessError):
        print("\nError: Pull Request creation failed.", file=sys.stderr)
        print("GitHub CLI Error:", file=sys.stderr)
        print(pr_output.stderr, file=sys.stderr)
        # We need to revert the commit if the PR fails
        print("Reverting local commit...", file=sys.stderr)
        run_command(["git", "reset", "HEAD~1"])
        sys.exit(1)
    
    print("\nPull Request created successfully!")
    print(pr_output)

    # 5. Update task status in a separate commit
    print(f"\nUpdating task '{task_id}' status to 'In Review'...")
    task["status"] = "In Review"
    save_tasks(tasks_data)

    print("Committing and pushing task status update...")
    status_commit_message = f"chore({task_id}): update task status to In Review"
    run_command(["git", "add", TASKS_FILE_PATH])
    run_command(["git", "commit", "-m", status_commit_message])
    run_command(["git", "push"])
    print("Task status update pushed successfully.")

def merge_task(pr_identifier):
    """
    Merges a pull request after verifying its status.
    """
    print(f"Attempting to merge pull request: {pr_identifier}")

    # 1. Check gh installation and authentication
    try:
        run_command(["gh", "--version"])
        run_command(["gh", "auth", "status"])
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print(f"GitHub CLI 'gh' is not installed, authenticated, or is malfunctioning. Please check your setup. Error: {e}", file=sys.stderr)
        sys.exit(1)

    # 2. Fetch PR status
    print("\nStep 1: Fetching PR status...")
    try:
        pr_json = run_command([
            "gh", "pr", "view", pr_identifier, "--json", 
            "number,state,headRefName,baseRefName,reviewDecision,statusCheckRollup"
        ])
        pr_data = json.loads(pr_json)
    except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
        print(f"Error fetching pull request data for '{pr_identifier}'. Please ensure it is a valid PR number, URL, or branch name. Error: {e}", file=sys.stderr)
        sys.exit(1)

    # 3. Validate PR status
    print("Step 2: Validating PR status...")
    if pr_data["state"] != "OPEN":
        print(f"Error: Pull request is not open. Current state: {pr_data['state']}", file=sys.stderr)
        sys.exit(1)
    
    if pr_data["reviewDecision"] != "APPROVED":
        print(f"Error: Pull request is not approved. Current review status: {pr_data['reviewDecision']}", file=sys.stderr)
        sys.exit(1)

    if pr_data["statusCheckRollup"] != "SUCCESS":
        print(f"Error: Not all status checks have passed. Current status: {pr_data['statusCheckRollup']}", file=sys.stderr)
        sys.exit(1)

    print("Validation successful: PR is open, approved, and all checks have passed.")

    # 4. Merge the pull request
    print("\nStep 3: Merging pull request...")
    try:
        merge_output = run_command(["gh", "pr", "merge", pr_identifier, "--squash", "--delete-branch"])
        print("Pull request merged successfully!")
        print(merge_output)
    except subprocess.CalledProcessError as e:
        print(f"Error merging pull request: {e.stderr}", file=sys.stderr)
        sys.exit(1)

    # 5. Update task status
    tasks_data = load_tasks()
    feature_branch = pr_data["headRefName"]
    branch_slug = feature_branch.split('/', 1)[1]
    
    all_task_ids = []
    for stage in tasks_data.get("stages", []):
        for task in stage.get("tasks", []):
            if task.get("id"):
                all_task_ids.append(task.get("id"))
            for subtask in task.get("subtasks", []):
                if subtask.get("id"):
                    all_task_ids.append(subtask.get("id"))

    task_id = None
    for tid in sorted(all_task_ids, key=len, reverse=True):
        if branch_slug.startswith(tid):
            task_id = tid
            break
    
    if task_id:
        task = find_task(tasks_data, task_id)
        if task:
            print(f"\nUpdating task '{task_id}' status to 'Completed'...")
            task["status"] = "Completed"
            task["completed_date"] = datetime.now().strftime("%Y-%m-%d")
            save_tasks(tasks_data)
    else:
        print(f"\nWarning: Could not determine task ID from branch '{feature_branch}'. Skipping status update.")

    # 6. Clean up local branches
    print("\nStep 4: Cleaning up local branches...")
    base_branch = pr_data["baseRefName"]
    
    run_command(["git", "checkout", base_branch])
    run_command(["git", "pull"])
    run_command(["git", "branch", "-d", feature_branch])
    print(f"Deleted local branch '{feature_branch}' and updated '{base_branch}'.")

    print("\nTask merged successfully!")

def sync_task(base_branch="develop"):
    """
    Syncs the current feature branch with the latest changes from the base branch.
    """
    print(f"Syncing current branch with '{base_branch}'...")

    # 1. Get current branch
    current_branch = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if not current_branch.startswith("feature/"):
        print("Error: Not on a feature branch. Cannot sync.", file=sys.stderr)
        sys.exit(1)

    # 2. Fetch latest changes from remote
    print("Step 1: Fetching latest changes from remote...")
    run_command(["git", "fetch", "origin"])

    # 3. Rebase onto the base branch
    print(f"Step 2: Rebasing '{current_branch}' onto 'origin/{base_branch}'...")
    try:
        run_command(["git", "rebase", f"origin/{base_branch}"])
        print("Rebase successful.")
    except subprocess.CalledProcessError:
        print("\nError: Automatic rebase failed.", file=sys.stderr)
        print("Please resolve the conflicts manually, then run 'git rebase --continue'.", file=sys.stderr)
        print("To abort the rebase, run 'git rebase --abort'.", file=sys.stderr)
        sys.exit(1)

    print("\nBranch synced successfully!")

def create_release(version, target_branch="main", source_branch="develop"):
    """
    Creates a new release by merging the source branch into target, tagging, and creating a GitHub Release.
    """
    print(f"Starting release process for version {version}...")

    if not version.startswith("v"):
        print(f"Error: Version '{version}' must start with 'v' (e.g., v1.0.0).", file=sys.stderr)
        sys.exit(1)

    try:
        run_command(["gh", "--version"])
        run_command(["gh", "auth", "status"])
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print(f"GitHub CLI 'gh' is not installed, authenticated, or is malfunctioning. Error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\nStep 1: Preparing '{target_branch}' for release...")
    checkout_branch(target_branch)
    
    print(f"Step 2: Merging '{source_branch}' into '{target_branch}'...")
    try:
        run_command(["git", "merge", "--ff-only", source_branch])
        print(f"Successfully fast-forwarded '{target_branch}' with changes from '{source_branch}'.")
    except subprocess.CalledProcessError:
        print(f"Error: Could not fast-forward merge '{source_branch}' into '{target_branch}'.", file=sys.stderr)
        print("Ensure the target branch is fully up-to-date with its remote counterpart and that develop has been merged cleanly.", file=sys.stderr)
        sys.exit(1)

    run_command(["git", "push", "origin", target_branch])

    print(f"\nStep 3: Creating GitHub Release for {version}...")
    try:
        release_output = run_command([
            "gh", "release", "create", version,
            "--target", target_branch,
            "--generate-notes",
            "--title", f"Release {version}"
        ])
        print("GitHub Release created successfully!")
        print(release_output)
    except subprocess.CalledProcessError as e:
        print(f"Error creating GitHub Release: {e.stderr}", file=sys.stderr)
        print("Attempting to roll back local merge...", file=sys.stderr)
        run_command(["git", "reset", "--hard", f"origin/{target_branch}"])
        sys.exit(1)
        
    print(f"\nRelease {version} created successfully!")

def main():
    """
    Main function to parse arguments and execute the corresponding command.
    """
    # First, check if the repository is clean
    git_status = run_command(["git", "status", "--porcelain"])
    if git_status:
        print("Error: Your working directory is not clean. There are uncommitted changes.", file=sys.stderr)
        print("Please commit or stash your changes before running the automation script.", file=sys.stderr)
        print("\nUncommitted changes:\n" + git_status, file=sys.stderr)
        sys.exit(1)

    parser = argparse.ArgumentParser(
        description="Meqenet Git Automation Tool for enterprise-grade workflows."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Sub-parser for the start-task command
    start_parser = subparsers.add_parser(
        "start-task", help="Start a new development task."
    )
    start_parser.add_argument("task_id", help="The unique identifier for the task from tasks.yaml (e.g., FND-BE-DB-01).")
    start_parser.add_argument(
        "--base-branch",
        default="develop",
        help="The base branch to create the feature branch from. Defaults to 'develop'.",
    )

    # Sub-parser for the complete-task command
    complete_parser = subparsers.add_parser(
        "complete-task", help="Complete a development task and prepare a pull request."
    )
    complete_parser.add_argument("--reviewers", nargs='*', help="GitHub usernames of the reviewers.")
    complete_parser.add_argument("--assignees", nargs='*', help="GitHub usernames of the assignees.")
    complete_parser.add_argument("--labels", nargs='*', help="Labels to add to the pull request.")

    # Sub-parser for the merge-task command
    merge_parser = subparsers.add_parser(
        "merge-task", help="Merge a pull request after successful checks."
    )
    merge_parser.add_argument("pr_identifier", help="The number, URL, or branch name of the pull request to merge.")

    # Sub-parser for the sync-task command
    sync_parser = subparsers.add_parser(
        "sync-task", help="Sync current feature branch with the latest from the base branch."
    )
    sync_parser.add_argument(
        "--base-branch",
        default="develop",
        help="The base branch to sync with. Defaults to 'develop'.",
    )

    # Sub-parser for the create-release command
    release_parser = subparsers.add_parser(
        "create-release", help="Create a new release on GitHub."
    )
    release_parser.add_argument("version", help="The version for the new release (e.g., v1.0.0).")
    release_parser.add_argument(
        "--target-branch",
        default="main",
        help="The target branch for the release. Defaults to 'main'.",
    )
    release_parser.add_argument(
        "--source-branch",
        default="develop",
        help="The source branch to merge into the target. Defaults to 'develop'.",
    )

    args = parser.parse_args()

    if args.command == "start-task":
        start_task(args.task_id, args.base_branch)
    elif args.command == "complete-task":
        complete_task(
            args.reviewers, 
            args.assignees, 
            args.labels
        )
    elif args.command == "merge-task":
        merge_task(args.pr_identifier)
    elif args.command == "sync-task":
        sync_task(args.base_branch)
    elif args.command == "create-release":
        create_release(args.version, args.target_branch, args.source_branch)

if __name__ == "__main__":
    main() 