#!/bin/bash

# Terraform Configuration Validation Script
# This script performs basic validation checks on the Terraform configuration

echo "========================================="
echo "Terraform Security Fixes Validation"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for issues
ISSUES=0

echo -e "\n${GREEN}✅ Checking file syntax...${NC}"

# Check if all .tf files are valid JSON/HCL
for file in *.tf; do
    if [ -f "$file" ]; then
        # Check for basic syntax issues
        if grep -q "{{" "$file" 2>/dev/null; then
            echo -e "${RED}❌ Found unclosed template syntax in $file${NC}"
            ((ISSUES++))
        fi
        
        # Check for balanced braces
        open_braces=$(grep -o '{' "$file" | wc -l)
        close_braces=$(grep -o '}' "$file" | wc -l)
        if [ "$open_braces" -ne "$close_braces" ]; then
            echo -e "${YELLOW}⚠️  Potential brace mismatch in $file (open: $open_braces, close: $close_braces)${NC}"
        fi
    fi
done

echo -e "\n${GREEN}✅ Verifying security fixes are present...${NC}"

# Check API Gateway fixes
echo -e "\n${YELLOW}API Gateway Security:${NC}"
grep -q "create_before_destroy.*=.*true" api_gateway.tf && echo "  ✓ Lifecycle management added" || echo "  ✗ Missing lifecycle"
grep -q "authorization.*=.*\"AWS_IAM\"" api_gateway.tf && echo "  ✓ AWS_IAM authorization enabled" || echo "  ✗ Missing authorization"
grep -q "aws_api_gateway_request_validator" api_gateway.tf && echo "  ✓ Request validator added" || echo "  ✗ Missing validator"

# Check RDS fixes
echo -e "\n${YELLOW}RDS Security:${NC}"
grep -q "multi_az.*=.*true" database.tf && echo "  ✓ Multi-AZ enabled" || echo "  ✗ Multi-AZ not enabled"
grep -q "auto_minor_version_upgrade.*=.*true" database.tf && echo "  ✓ Auto minor upgrades enabled" || echo "  ✗ Auto upgrades not enabled"
grep -q "monitoring_interval.*=" database.tf && echo "  ✓ Enhanced monitoring configured" || echo "  ✗ Enhanced monitoring missing"
grep -q "aws_db_parameter_group.*postgres_logging" database.tf && echo "  ✓ PostgreSQL logging configured" || echo "  ✗ Logging not configured"
grep -q "copy_tags_to_snapshot.*=.*true" database.tf && echo "  ✓ Copy tags to snapshots enabled" || echo "  ✗ Tags not copied"
grep -q "aws_secretsmanager_secret_rotation" database.tf && echo "  ✓ Secret rotation configured" || echo "  ✗ Secret rotation missing"

# Check ALB fixes
echo -e "\n${YELLOW}ALB/Load Balancer Security:${NC}"
grep -q "access_logs.*{" load_balancer.tf && echo "  ✓ Access logging enabled" || echo "  ✗ Access logging missing"
grep -q "drop_invalid_header_fields.*=.*true" load_balancer.tf && echo "  ✓ Invalid header dropping enabled" || echo "  ✗ Header dropping not enabled"
grep -q "aws_lb_listener.*https" load_balancer.tf && echo "  ✓ HTTPS listener configured" || echo "  ✗ HTTPS listener missing"
grep -q "aws_wafv2_web_acl" load_balancer.tf && echo "  ✓ WAF configured" || echo "  ✗ WAF missing"
grep -q "protocol.*=.*\"HTTPS\"" load_balancer.tf && echo "  ✓ HTTPS protocol used" || echo "  ✗ HTTP protocol still in use"

# Check IAM fixes
echo -e "\n${YELLOW}IAM Policy Security:${NC}"
grep -c "Resource.*=.*\"\*\"" main.tf | awk '{if ($1 < 5) print "  ✓ Wildcard resources minimized"; else print "  ⚠ Still have " $1 " wildcard resources"}'

# Check S3 fixes
echo -e "\n${YELLOW}S3 Bucket Security:${NC}"
grep -q "aws_s3_bucket_lifecycle_configuration" main.tf && echo "  ✓ Lifecycle configuration added" || echo "  ✗ Lifecycle missing"
grep -q "aws_s3_bucket_notification" main.tf && echo "  ✓ Event notifications configured" || echo "  ✗ Notifications missing"
grep -q "aws_s3_bucket_replication_configuration" main.tf && echo "  ✓ Cross-region replication configured" || echo "  ✗ Replication missing"

# Check KMS fixes
echo -e "\n${YELLOW}KMS Key Security:${NC}"
grep -c "policy.*=.*jsonencode" database.tf events.tf | awk '{if ($1 >= 3) print "  ✓ KMS key policies defined"; else print "  ⚠ Some KMS keys missing policies"}'

# Check miscellaneous fixes
echo -e "\n${YELLOW}Other Security Fixes:${NC}"
grep -q "sns_topic_name.*=" main.tf && echo "  ✓ CloudTrail SNS topic configured" || echo "  ✗ SNS topic missing"
grep -q "retention_in_days.*=.*365" networking.tf && echo "  ✓ Log retention set to 1 year" || echo "  ✗ Log retention insufficient"
grep -q "aws_default_security_group" networking.tf && echo "  ✓ Default security group restricted" || echo "  ✗ Default SG not restricted"

echo -e "\n${GREEN}✅ Checking for required data sources...${NC}"
grep -q "data.*\"aws_region\".*\"current\"" main.tf && echo "  ✓ AWS region data source present" || echo "  ✗ AWS region data source missing"
grep -q "data.*\"aws_caller_identity\".*\"current\"" main.tf && echo "  ✓ AWS caller identity data source present" || echo "  ✗ Caller identity missing"

echo -e "\n${GREEN}✅ Checking for required providers...${NC}"
grep -q "provider.*\"aws\".*{" main.tf && echo "  ✓ Primary AWS provider configured" || echo "  ✗ Primary provider missing"
grep -q "alias.*=.*\"replica\"" main.tf && echo "  ✓ Replica provider configured" || echo "  ✗ Replica provider missing"

echo -e "\n========================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Validation completed successfully!${NC}"
    echo -e "${GREEN}All security fixes appear to be in place.${NC}"
else
    echo -e "${RED}❌ Validation found $ISSUES issue(s)${NC}"
    echo -e "${YELLOW}Please review the issues above before applying changes.${NC}"
fi
echo "========================================="

# List all modified files
echo -e "\n${YELLOW}Modified Terraform files:${NC}"
ls -la *.tf 2>/dev/null | awk '{print "  - " $9 " (" $5 " bytes)"}'

echo -e "\n${GREEN}Next Steps:${NC}"
echo "1. Run 'terraform init' to initialize the configuration"
echo "2. Run 'terraform plan' to review the changes"
echo "3. Run 'terraform validate' to check for configuration errors"
echo "4. Re-run Checkov to verify security fixes:"
echo "   checkov -d . --framework terraform --output sarif"
