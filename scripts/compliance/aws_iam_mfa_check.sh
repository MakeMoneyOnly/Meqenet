#!/bin/bash
#
# aws_iam_mfa_check.sh
#
# This script checks that all IAM users have MFA enabled.
# It is an example of an evidence automation script for compliance.
#
# Evidence for: PCI DSS Req 8, SOC 2 CC6.1

echo "AWS IAM MFA Check Report"
echo "Generated on: $(date)"
echo "---------------------------------"

# Get a list of all IAM users
users=$(aws iam list-users --query 'Users[*].UserName' --output text)

if [ -z "$users" ]; then
    echo "No IAM users found."
    exit 0
fi

mfa_compliant=true

for user in $users; do
    # Check if the user has MFA devices
    mfa_devices=$(aws iam list-mfa-devices --user-name "$user" --query 'MFADevices' --output text)
    if [ -z "$mfa_devices" ]; then
        echo "[NON-COMPLIANT] User '$user' does NOT have MFA enabled."
        mfa_compliant=false
    else
        echo "[COMPLIANT] User '$user' has MFA enabled."
    fi
done

echo "---------------------------------"
if [ "$mfa_compliant" = true ]; then
    echo "Result: All users are compliant."
else
    echo "Result: One or more users are non-compliant."
fi
