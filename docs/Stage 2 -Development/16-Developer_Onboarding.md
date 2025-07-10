# 16. Developer Onboarding

_This document is a placeholder for the full Developer Onboarding guide. It will be populated with
comprehensive details in a subsequent task._

## 1. Overview

Welcome to the Meqenet engineering team! This guide provides a checklist to get you set up and ready
to contribute to our microservices ecosystem.

## 2. Initial Steps

- [ ] **Access Granted**: Ensure you have access to GitHub, AWS, Jira, and Slack.
- [ ] **Review Key Documents**:
  - [ ] Familiarize yourself with the system design in
        [08-Architecture.md](../Stage%201%20-%20Foundation/08-Architecture.md).
  - [ ] Understand the project goals in the [PRD](../Stage%201%20-%20Foundation/04-PRD.md).
  - [ ] Review the high-level tasks in [tasks.yaml](../../tasks/tasks.yaml).

## 3. Local Environment Setup Checklist

- [ ] **Clone Repositories**:
  - [ ] Clone the Backend Monorepo (`git clone ...`)
  - [ ] Clone the Frontend Monorepo (`git clone ...`)
- [ ] **Install Core Dependencies**:
  - [ ] Install Node.js (LTS), Docker, and PNPM.
- [ ] **Configure Environment**:
  - [ ] Set up your local `.env` files from the provided templates.
- [ ] **Run Local Services**:
  - [ ] Launch the core microservice stack with `docker-compose up`.
- [ ] **Verify Setup**:
  - [ ] Run unit and integration tests to confirm your environment is configured correctly.

## 4. Your First Contribution

- [ ] Find a "good first issue" in Jira.
- [ ] Create a feature branch.
- [ ] Submit a Pull Request (PR) and go through the code review process.

## 5. Key Contacts

_This section will be populated with key contacts for different domains (e.g., Architecture,
Security, specific microservices)._

## 6. First Service Creation

To ensure consistency and accelerate development, all new microservices must be bootstrapped from
our standard service template. This template includes the foundational setup for:

- **Directory Structure**: A standardized layout for source code, tests, and documentation.
- **Dockerfile**: A pre-configured Dockerfile for containerization.
- **CI/CD Pipeline Configuration**: A baseline `.gitlab-ci.yml` or GitHub Actions workflow file.
- **Observability Hooks**: Pre-configured libraries and endpoints for logging, metrics (Prometheus),
  and tracing (OpenTelemetry).
- **Health Check Endpoint**: A default `/health` endpoint as required by Kubernetes.

**To create a new service:**

1.  Use the `cookiecutter` command to generate a new service from the central template repository.
2.  Follow the prompts to name the service and define its initial ownership.
3.  Push the newly generated code to a new repository within the monorepo structure.

## 7. Code Contribution

- **Branching Strategy**: Follow a trunk-based development model. Create short-lived feature
  branches from `main`.
- **Pull Requests (PRs)**: All code must be submitted via PRs. PRs require at least one approval
  from a service owner or tech lead.
