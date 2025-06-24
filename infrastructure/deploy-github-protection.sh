#!/bin/bash

# GitHub Branch Protection Deployment Script for Meqenet.et
# Deploy Infrastructure as Code for FinTech compliance and security
# Ensures NBE audit trail and regulatory compliance

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# FinTech Security Banner
echo -e "${BLUE}"
echo "=============================================================="
echo "   Meqenet.et GitHub Repository Protection Deployment"
echo "   FinTech Infrastructure as Code - NBE Compliant"
echo "=============================================================="
echo -e "${NC}"

# Verify prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install Terraform first.${NC}"
    echo "   Visit: https://learn.hashicorp.com/tutorials/terraform/install-cli"
    exit 1
fi

# Check if GitHub CLI is installed (optional but recommended)
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI detected${NC}"
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated. Run 'gh auth login' for easier management${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not detected (optional)${NC}"
fi

# Check Terraform version
TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
echo -e "${GREEN}✅ Terraform version: ${TERRAFORM_VERSION}${NC}"

# Verify required files exist
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}❌ terraform.tfvars file not found!${NC}"
    echo -e "${YELLOW}📋 Please copy terraform.tfvars.example to terraform.tfvars and fill in your values:${NC}"
    echo "   cp terraform.tfvars.example terraform.tfvars"
    echo "   # Edit terraform.tfvars with your GitHub token and organization details"
    exit 1
fi

# Security warning for sensitive data
echo -e "${YELLOW}🔐 SECURITY REMINDER:${NC}"
echo "   - terraform.tfvars contains sensitive GitHub tokens"
echo "   - This file should NEVER be committed to git"
echo "   - Use environment variables in CI/CD pipelines"
echo ""

# Environment selection
echo -e "${BLUE}🎯 Select deployment environment:${NC}"
echo "1) Development (dev environment)"
echo "2) Staging (pre-production)"
echo "3) Production (live environment)"
echo -n "Enter choice (1-3): "
read -r ENV_CHOICE

case $ENV_CHOICE in
    1)
        ENVIRONMENT="development"
        WORKSPACE="dev"
        echo -e "${YELLOW}📍 Deploying to DEVELOPMENT environment${NC}"
        ;;
    2)
        ENVIRONMENT="staging"
        WORKSPACE="staging"
        echo -e "${YELLOW}📍 Deploying to STAGING environment${NC}"
        ;;
    3)
        ENVIRONMENT="production"
        WORKSPACE="production"
        echo -e "${RED}🔴 Deploying to PRODUCTION environment${NC}"
        echo -e "${RED}⚠️  CRITICAL: This will affect live FinTech operations!${NC}"
        echo -n "Type 'YES' to confirm production deployment: "
        read -r CONFIRM
        if [ "$CONFIRM" != "YES" ]; then
            echo -e "${YELLOW}❌ Production deployment cancelled${NC}"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Initialize Terraform
echo -e "${BLUE}🚀 Initializing Terraform...${NC}"
terraform init

# Create/select workspace for environment isolation
echo -e "${BLUE}🔧 Setting up Terraform workspace: ${WORKSPACE}${NC}"
terraform workspace select "$WORKSPACE" 2>/dev/null || terraform workspace new "$WORKSPACE"

# Validate Terraform configuration
echo -e "${BLUE}✅ Validating Terraform configuration...${NC}"
terraform validate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform validation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Terraform configuration is valid${NC}"

# Format check
echo -e "${BLUE}🎨 Checking Terraform formatting...${NC}"
terraform fmt -check

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Terraform files need formatting. Running terraform fmt...${NC}"
    terraform fmt
fi

# Generate and review plan
echo -e "${BLUE}📋 Generating Terraform execution plan...${NC}"
terraform plan -out=tfplan

echo -e "${YELLOW}📊 Please review the plan above carefully.${NC}"
echo "   This will create/modify:"
echo "   - GitHub repository settings"
echo "   - Branch protection rules"
echo "   - Team permissions"
echo "   - Compliance webhooks"
echo ""

# Final confirmation
echo -e "${BLUE}🤔 Do you want to apply these changes?${NC}"
echo -n "Type 'apply' to continue: "
read -r APPLY_CONFIRM

if [ "$APPLY_CONFIRM" != "apply" ]; then
    echo -e "${YELLOW}❌ Deployment cancelled${NC}"
    rm -f tfplan
    exit 0
fi

# Apply the changes
echo -e "${GREEN}🚀 Applying Terraform changes...${NC}"
terraform apply tfplan

if [ $? -eq 0 ]; then
    echo -e "${GREEN}"
    echo "=============================================================="
    echo "   ✅ GitHub Repository Protection Successfully Deployed!"
    echo "=============================================================="
    echo -e "${NC}"
    
    # Display deployment summary
    echo -e "${BLUE}📊 Deployment Summary:${NC}"
    echo "   Environment: $ENVIRONMENT"
    echo "   Workspace: $WORKSPACE"
    echo "   Repository: $(terraform output -raw repository_url)"
    echo ""
    
    echo -e "${GREEN}🔒 Branch Protection Rules Applied:${NC}"
    terraform output branch_protection_summary
    
    echo -e "${BLUE}📚 Next Steps:${NC}"
    echo "   1. Verify branch protection rules in GitHub"
    echo "   2. Test pull request workflow"
    echo "   3. Configure CI/CD status checks"
    echo "   4. Train team on new procedures"
    echo "   5. Update project documentation"
    
    echo -e "${YELLOW}🔐 Security Reminders:${NC}"
    echo "   - Review team permissions regularly"
    echo "   - Monitor compliance webhook events"
    echo "   - Audit access logs monthly"
    echo "   - Keep GitHub tokens secure"
    
else
    echo -e "${RED}"
    echo "=============================================================="
    echo "   ❌ Deployment Failed!"
    echo "=============================================================="
    echo -e "${NC}"
    echo -e "${RED}💥 Terraform apply failed. Please check the errors above.${NC}"
    exit 1
fi

# Cleanup
rm -f tfplan

echo -e "${GREEN}✨ Deployment completed successfully!${NC}" 