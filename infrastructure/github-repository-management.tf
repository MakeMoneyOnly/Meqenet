# GitHub Repository Management for Meqenet.et FinTech Platform
# Infrastructure as Code for branch protection and repository governance
# Ensures NBE compliance and audit trail requirements

terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

# Configure GitHub Provider
provider "github" {
  token = var.github_token
  owner = var.github_organization
}

# Variables for configuration
variable "github_token" {
  description = "GitHub Personal Access Token with admin:repo permissions"
  type        = string
  sensitive   = true
}

variable "github_organization" {
  description = "GitHub organization name"
  type        = string
  default     = "meqenet-et"
}

variable "repository_name" {
  description = "Main repository name"
  type        = string
  default     = "meqenet"
}

# Repository configuration (if creating new repo)
resource "github_repository" "meqenet_main" {
  name         = var.repository_name
  description  = "Meqenet.et - Ethiopia's First BNPL Financial Super-App"
  visibility   = "private" # Critical for FinTech security
  
  # FinTech Security Requirements
  has_issues                 = true
  has_projects              = true
  has_wiki                  = false # Centralized docs only
  allow_merge_commit        = false # Enforce clean history
  allow_squash_merge        = true
  allow_rebase_merge        = false
  delete_branch_on_merge    = true
  auto_init                 = true
  
  # Security Features
  vulnerability_alerts               = true
  ignore_vulnerability_alerts_during_read = false
  
  # Branch Protection
  has_downloads = false # Prevent unauthorized downloads
  
  topics = [
    "fintech",
    "bnpl", 
    "ethiopia",
    "nbe-compliant",
    "microservices",
    "react-native",
    "nestjs"
  ]

  # Template files will be managed separately
  gitignore_template = "Node"
  license_template   = "mit"
}

# Main Branch Protection (Production)
resource "github_branch_protection" "main" {
  repository_id = github_repository.meqenet_main.node_id
  pattern       = "main"

  # Critical FinTech Requirements
  enforce_admins                = true
  allows_deletions             = false
  allows_force_pushes          = false
  require_conversation_resolution = true

  # Pull Request Reviews (NBE Compliance)
  required_pull_request_reviews {
    required_approving_review_count      = 2
    dismiss_stale_reviews               = true
    require_code_owner_reviews          = true
    restrict_dismissals                 = true
    dismissal_restrictions              = [
      "meqenet-et/financial-software-architects",
      "meqenet-et/data-security-specialists"
    ]
    pull_request_bypassers             = [
      "meqenet-et/emergency-response-team"
    ]
  }

  # Status Checks (Comprehensive FinTech Pipeline)
  required_status_checks {
    strict = true
    contexts = [
      # Backend Microservices
      "CI/Backend/Lint & Type Check",
      "CI/Backend/Unit Tests", 
      "CI/Backend/Integration Tests",
      "CI/Backend/Security Scan (SAST)",
      "CI/Backend/Dependency Check (SCA)",
      "CI/Backend/Container Security Scan",
      
      # FinTech Specific Validations
      "CI/FinTech/Payment Calculation Tests",
      "CI/FinTech/Interest Rate Validation", 
      "CI/FinTech/Currency Precision Tests",
      "CI/FinTech/NBE Compliance Check",
      "CI/FinTech/Fayda ID Format Validation",
      "CI/FinTech/Financial Logic Audit",
      
      # Frontend Applications
      "CI/Frontend/Lint & Type Check",
      "CI/Frontend/Unit Tests",
      "CI/Frontend/E2E Tests",
      "CI/Frontend/Accessibility Tests (WCAG 2.1)",
      "CI/Frontend/Security Scan",
      "CI/Frontend/Bundle Size Check",
      "CI/Frontend/Performance Budget",
      
      # Ethiopian Localization
      "CI/Localization/Amharic Support",
      "CI/Localization/Ethiopian Date Format",
      "CI/Localization/Currency Display (ETB)",
      
      # Infrastructure & Security
      "CI/Infrastructure/Terraform Validate",
      "CI/Security/DAST Scan",
      "CI/Security/Secret Detection",
      "CI/Documentation/Mermaid Validation",
      
      # Ethiopian Payment Gateways
      "CI/Payments/Telebirr Integration Test",
      "CI/Payments/Chapa Gateway Test",
      "CI/Payments/SantimPay Integration Test",
      "CI/Payments/ArifPay Integration Test",
      
      # Compliance & Audit
      "CI/Compliance/Ethiopian Regulations",
      "CI/Compliance/Data Protection (GDPR-like)",
      "CI/Compliance/AML/KYC Validation",
      "CI/Audit/Change Documentation"
    ]
  }

  # Linear History for Audit Trail
  required_linear_history = true

  # Enforce signed commits for protected branches (satisfy tfsec rule)
  require_signed_commits = true
}

# Develop Branch Protection (Integration)
resource "github_branch_protection" "develop" {
  repository_id = github_repository.meqenet_main.node_id
  pattern       = "develop"

  enforce_admins      = true
  allows_deletions    = false
  allows_force_pushes = false

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews          = true
    require_code_owner_reviews     = true
  }

  required_status_checks {
    strict = true
    contexts = [
      # Core Quality Checks
      "CI/Backend/Lint & Type Check",
      "CI/Frontend/Lint & Type Check", 
      "CI/Backend/Unit Tests",
      "CI/Frontend/Unit Tests",
      "CI/Security/Basic Security Scan",
      "CI/Architecture/Feature Slice Validation",
      
      # Ethiopian Specific
      "CI/Localization/Amharic Support",
      "CI/Payments/Ethiopian Gateway Mock Tests",
      "CI/FinTech/Basic Financial Logic Tests"
    ]
  }

  # Enforce signed commits
  require_signed_commits = true
}

# Staging Branch Protection (Pre-Production)
resource "github_branch_protection" "staging" {
  repository_id = github_repository.meqenet_main.node_id
  pattern       = "staging"

  enforce_admins      = false # Allow emergency deployments
  allows_deletions    = false
  allows_force_pushes = true  # Emergency hotfixes only

  required_pull_request_reviews {
    required_approving_review_count = 1
    require_code_owner_reviews     = true
    dismiss_stale_reviews          = false # Keep for deployment history
  }

  required_status_checks {
    strict = false # Emergency deployment flexibility
    contexts = [
      "CI/Integration/Full E2E Tests",
      "CI/Performance/Load Tests",
      "CI/Security/Penetration Tests",
      "CI/Compliance/Full Audit",
      "CI/FinTech/End-to-End Payment Flow"
    ]
  }

  # Enforce signed commits for auditability
  require_signed_commits = true
}

# Security Branch Protection (High Priority)
resource "github_branch_protection" "security" {
  repository_id = github_repository.meqenet_main.node_id
  pattern       = "security/*"

  enforce_admins      = true
  allows_deletions    = false
  allows_force_pushes = false

  required_pull_request_reviews {
    required_approving_review_count = 2
    dismiss_stale_reviews          = true
    require_code_owner_reviews     = true
    restrict_dismissals            = true
    dismissal_restrictions         = [
      "meqenet-et/data-security-specialists"
    ]
  }

  required_status_checks {
    strict = true
    contexts = [
      "CI/Security/Enhanced SAST Scan",
      "CI/Security/Vulnerability Assessment", 
      "CI/Security/Penetration Test",
      "CI/Compliance/Security Audit",
      "CI/FinTech/Security Impact Assessment"
    ]
  }

  # Enforce signed commits
  require_signed_commits = true
}

# Repository Teams for CODEOWNERS
resource "github_team" "financial_software_architects" {
  name        = "financial-software-architects"
  description = "Financial Software Architects - Core financial logic oversight"
  privacy     = "closed"
}

resource "github_team" "data_security_specialists" {
  name        = "data-security-specialists" 
  description = "Data Security Specialists - Security and compliance oversight"
  privacy     = "closed"
}

resource "github_team" "compliance_risk_officers" {
  name        = "compliance-risk-officers"
  description = "Compliance & Risk Officers - NBE regulation compliance"
  privacy     = "closed"
}

resource "github_team" "senior_backend_developers" {
  name        = "senior-backend-developers"
  description = "Senior Backend Developers - Backend microservices"
  privacy     = "closed"
}

resource "github_team" "senior_mobile_developers" {
  name        = "senior-mobile-developers"
  description = "Senior Mobile Developers - React Native and web frontend"
  privacy     = "closed"
}

resource "github_team" "fintech_devops_engineers" {
  name        = "fintech-devops-engineers"
  description = "FinTech DevOps Engineers - Infrastructure and deployment"
  privacy     = "closed"
}

# Repository Access for Teams
resource "github_team_repository" "financial_architects_admin" {
  team_id    = github_team.financial_software_architects.id
  repository = github_repository.meqenet_main.name
  permission = "admin"
}

resource "github_team_repository" "security_specialists_admin" {
  team_id    = github_team.data_security_specialists.id
  repository = github_repository.meqenet_main.name
  permission = "admin" 
}

resource "github_team_repository" "compliance_officers_maintain" {
  team_id    = github_team.compliance_risk_officers.id
  repository = github_repository.meqenet_main.name
  permission = "maintain"
}

resource "github_team_repository" "backend_developers_write" {
  team_id    = github_team.senior_backend_developers.id
  repository = github_repository.meqenet_main.name
  permission = "push"
}

resource "github_team_repository" "mobile_developers_write" {
  team_id    = github_team.senior_mobile_developers.id
  repository = github_repository.meqenet_main.name
  permission = "push"
}

resource "github_team_repository" "devops_engineers_admin" {
  team_id    = github_team.fintech_devops_engineers.id
  repository = github_repository.meqenet_main.name
  permission = "admin"
}

# Repository Webhooks for Compliance Monitoring
resource "github_repository_webhook" "compliance_monitoring" {
  repository = github_repository.meqenet_main.name

  configuration {
    url          = "https://compliance-monitor.meqenet.et/webhook"
    content_type = "json"
    insecure_ssl = false
    secret       = var.webhook_secret
  }

  active = true

  events = [
    "push",
    "pull_request", 
    "pull_request_review",
    "branch_protection_rule",
    "security_advisory"
  ]
}

# Branch Protection Rule for Release Branches
resource "github_branch_protection" "release" {
  repository_id = github_repository.meqenet_main.node_id
  pattern       = "release/*"

  enforce_admins      = true
  allows_deletions    = false
  allows_force_pushes = false

  required_pull_request_reviews {
    required_approving_review_count = 2
    require_code_owner_reviews     = true
    dismiss_stale_reviews          = true
  }

  required_status_checks {
    strict = true
    contexts = [
      "CI/Release/Version Validation",
      "CI/Release/Changelog Generation",
      "CI/Release/Security Scan",
      "CI/Release/Performance Benchmarks"
    ]
  }

  # Enforce signed commits
  require_signed_commits = true
}

# Output important information
output "repository_url" {
  description = "URL of the created repository"
  value       = github_repository.meqenet_main.html_url
}

output "repository_ssh_clone_url" {
  description = "SSH clone URL"
  value       = github_repository.meqenet_main.ssh_clone_url
}

output "branch_protection_summary" {
  description = "Summary of protected branches"
  value = {
    main = {
      required_reviews = 2
      status_checks = length(github_branch_protection.main.required_status_checks[0].contexts)
    }
    develop = {
      required_reviews = 1
      status_checks = length(github_branch_protection.develop.required_status_checks[0].contexts)
    }
    staging = {
      required_reviews = 1
      status_checks = length(github_branch_protection.staging.required_status_checks[0].contexts)
    }
  }
}

# Variables for sensitive data
variable "webhook_secret" {
  description = "Secret for compliance monitoring webhook"
  type        = string
  sensitive   = true
} 