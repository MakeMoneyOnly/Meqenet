# Git Automation Script

This directory contains a powerful Python script, `git-automation.py`, designed to automate the
entire development workflow, from starting a task to creating a release. It integrates with
`tasks.yaml` to create a seamless, task-driven development process that enforces enterprise-grade
standards for a FinTech environment.

## Prerequisites

Before using the script, ensure you have the following installed and configured:

1.  **Python 3**: With the `ruamel.yaml` package.
2.  **Git**: Properly configured with your user name and email.
3.  **GitHub CLI (`gh`)**: Authenticated with your GitHub account. Run `gh auth login`.
4.  **Node.js & pnpm**: Required for running project-specific quality checks (lint, format, test).

## Installation

Install the required Python package by running the following command from the root of the
repository:

```bash
pip install -r tools/git/requirements.txt
```

## Commands

The script offers a suite of commands to manage the development lifecycle.

### 1. `start-task`

Initializes work on a new task from `tasks.yaml`.

**Usage:**

```bash
python tools/git/git-automation.py start-task <TASK_ID>
```

- `<TASK_ID>`: The ID of the task from `tasks/tasks.yaml` (e.g., `FND-BE-DB-01`).

**What it does:**

- Fetches the task details from `tasks.yaml`.
- Creates a new Git branch with the name `feature/<TASK_ID>-<task-name>`.
- Updates the task's status to `In Progress` in `tasks.yaml`.

### 2. `start-hotfix`

Creates a new security or critical hotfix branch following fintech emergency procedures.

**Usage:**

```bash
python tools/git/git-automation.py start-hotfix <HOTFIX_ID> "<DESCRIPTION>" [--severity SEC|CRIT]
```

- `<HOTFIX_ID>`: Unique identifier for the hotfix (e.g., `01`, `02`).
- `<DESCRIPTION>`: Brief description of the hotfix.
- `--severity`: Severity level: `SEC` (Security) or `CRIT` (Critical). Defaults to `SEC`.

**Examples:**

```bash
# Start a security hotfix
python tools/git/git-automation.py start-hotfix 01 "Fix authentication vulnerability" --severity SEC

# Start a critical hotfix
python tools/git/git-automation.py start-hotfix 02 "Fix payment processing crash" --severity CRIT
```

**What it does:**

- Creates a new hotfix branch from `main` (production) following fintech standards
- Validates branch naming against enterprise patterns
- Provides security reminders and compliance guidelines
- Sets up proper branch tracking for audit purposes

### 3. `close-security-branch`

**🆕 NEW FEATURE**: Closes a security branch with NBE-compliant audit trail and clean deletion.

**Usage:**

```bash
python tools/git/git-automation.py close-security-branch <BRANCH_NAME> <INCIDENT_ID> "<DESCRIPTION>" [--skip-audit-tag]
```

- `<BRANCH_NAME>`: Name of the security branch to close (e.g.,
  `fix/SEC-01-update-vitest-esbuild-vulnerability`).
- `<INCIDENT_ID>`: Security incident ID (e.g., `SEC-01`, `CRIT-02`).
- `<DESCRIPTION>`: Description of the security resolution.
- `--skip-audit-tag`: Skip creating audit tag (for testing only - not recommended for production).

**Example:**

```bash
python tools/git/git-automation.py close-security-branch \
  "fix/SEC-01-update-vitest-esbuild-vulnerability" \
  "SEC-01" \
  "Vitest/esbuild vulnerabilities eliminated"
```

**What it does (Combined Option A + B):**

1. **🔍 Validates** branch existence (local/remote)
2. **🔒 Verifies** security resolution via `pnpm audit`
3. **📋 Creates** NBE compliance audit tag (`security/SEC-01-resolved-v1.0.0`)
4. **⬆️ Pushes** audit tag to remote for permanent record
5. **🗑️ Deletes** local and remote branches for repository hygiene
6. **📊 Provides** compliance summary and next steps

**Benefits:**

- ✅ **NBE Compliance**: Permanent audit trail via Git tags
- ✅ **Repository Hygiene**: Clean branch structure
- ✅ **Traceability**: Security incident resolution documented
- ✅ **Best Practice**: Enterprise Git workflow standards

### 4. `sync-task`

Updates your current feature branch with the latest changes from the `develop` branch.

**Usage:**

```bash
python tools/git/git-automation.py sync-task
```

**What it does:**

- Fetches the latest changes from the remote `develop` branch.
- Rebases your current feature branch on top of `develop` to maintain a clean and linear history.

### 5. `complete-task`

Finalizes your work, runs quality checks, and creates a pull request.

**Usage:**

```bash
python tools/git/git-automation.py complete-task --reviewers "user1" "user2" --labels "feature" "security"
```

- `--reviewers`: (Optional) A list of GitHub usernames to request reviews from.
- `--assignees`: (Optional) A list of GitHub usernames to assign to the PR.
- `--labels`: (Optional) A list of labels to add to the PR.

**What it does:**

- Runs all quality checks: `format:write`, `lint:fix`, and `test`.
- Commits your changes with a standardized message (e.g., `feat(TASK_ID): Implement new feature`).
- Pushes your branch to the remote repository.
- Creates a pull request on GitHub.
- Updates the task's status to `In Review` in `tasks.yaml`.

### 6. `merge-task`

Merges an approved and validated pull request into the `develop` branch.

**Usage:**

```bash
python tools/git/git-automation.py merge-task <PR_IDENTIFIER>
```

- `<PR_IDENTIFIER>`: The number, URL, or branch name of the pull request.

**What it does:**

- Verifies that the pull request is approved and all CI checks have passed.
- Merges the pull request using the "squash and merge" strategy.
- Deletes the remote and local feature branches.
- Updates the task's status to `Completed` in `tasks.yaml`.

### 7. `create-release`

Automates the process of creating a new software release.

**Usage:**

```bash
python tools/git/git-automation.py create-release <VERSION>
```

- `<VERSION>`: The semantic version for the new release (e.g., `v1.2.0`).

**What it does:**

- Merges the `develop` branch into the `main` branch.
- Creates a Git tag for the specified version.
- Generates a new release on GitHub with automated release notes.

## Full Workflow Examples

### Standard Feature Development

1.  **Start a task:**

    ```bash
    python tools/git/git-automation.py start-task FND-BE-DB-01
    ```

2.  **Work on your code...**

3.  **Sync your branch (optional but recommended):**

    ```bash
    python tools/git/git-automation.py sync-task
    ```

4.  **Complete the task and create a PR:**

    ```bash
    python tools/git/git-automation.py complete-task --reviewers "lead-dev" --labels "auth" "backend"
    ```

5.  **After the PR is approved, merge it:**

    ```bash
    python tools/git/git-automation.py merge-task 123
    ```

### Security Incident Management

1.  **Start a security hotfix:**

    ```bash
    python tools/git/git-automation.py start-hotfix 01 "Fix critical authentication vulnerability" --severity SEC
    ```

2.  **Work on the security fix...**

3.  **After fix is merged to develop, close the security branch:**

    ```bash
    python tools/git/git-automation.py close-security-branch \
      "fix/SEC-01-fix-critical-authentication-vulnerability" \
      "SEC-01" \
      "Authentication vulnerability patched - CVE-2024-XXXX resolved"
    ```

### Release Management

**When ready to release, create the release:**

```bash
python tools/git/git-automation.py create-release v1.0.0
```
