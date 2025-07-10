# Git Automation Script

This directory contains a powerful Python script, `git-automation.py`, designed to automate the
entire development workflow, from starting a task to creating a release. It integrates with
`tasks.yaml` to create a seamless, task-driven development process that enforces enterprise-grade
standards for a FinTech environment.

## 🏦 Fintech Branching Strategy

**IMPORTANT**: This project follows a strict **Enterprise-Grade Fintech Branching Strategy** to
ensure NBE compliance and audit traceability.

📋 **See**: [`FINTECH_BRANCHING_STRATEGY.md`](./FINTECH_BRANCHING_STRATEGY.md) for complete
documentation.

### Quick Reference:

- **`main`**: Production (NBE compliant, signed commits required)
- **`develop`**: Integration/Staging (all features merge here first)
- **`feature/[TASK-ID]-[description]`**: New features (from `develop`)
- **`hotfix/[SEC|CRIT]-[ID]-[description]`**: Security/Critical fixes
- **`release/v[major].[minor].[patch]`**: Release preparation

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

### 2. `sync-task`

Updates your current feature branch with the latest changes from the `develop` branch.

**Usage:**

```bash
python tools/git/git-automation.py sync-task
```

**What it does:**

- Fetches the latest changes from the remote `develop` branch.
- Rebases your current feature branch on top of `develop` to maintain a clean and linear history.

### 3. `complete-task`

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

### 4. `merge-task`

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

### 5. `create-release`

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

## Full Workflow Example

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

6.  **When ready to release, create the release:**
    ```bash
    python tools/git/git-automation.py create-release v1.0.0
    ```
