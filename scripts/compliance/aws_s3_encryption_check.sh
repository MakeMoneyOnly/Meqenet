#!/bin/bash
#
# aws_s3_encryption_check.sh
#
# This script checks that all S3 buckets have server-side encryption enabled.
# It is an example of an evidence automation script for compliance.
#
# Evidence for: PCI DSS Req 3, GDPR Art. 32

echo "AWS S3 Encryption Check Report"
echo "Generated on: $(date)"
echo "---------------------------------"

# Get a list of all S3 buckets
buckets=$(aws s3api list-buckets --query 'Buckets[*].Name' --output text)

if [ -z "$buckets" ]; then
    echo "No S3 buckets found."
    exit 0
fi

encryption_compliant=true

for bucket in $buckets; do
    # Check if the bucket has server-side encryption enabled
    encryption=$(aws s3api get-bucket-encryption --bucket "$bucket" 2>/dev/null)
    if [ -z "$encryption" ]; then
        echo "[NON-COMPLIANT] Bucket '$bucket' does NOT have server-side encryption enabled."
        encryption_compliant=false
    else
        echo "[COMPLIANT] Bucket '$bucket' has server-side encryption enabled."
    fi
done

echo "---------------------------------"
if [ "$encryption_compliant" = true ]; then
    echo "Result: All buckets are compliant."
else
    echo "Result: One or more buckets are non-compliant."
fi
