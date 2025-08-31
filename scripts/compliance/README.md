# Compliance Evidence Automation Scripts

This directory contains scripts designed to automate the collection of evidence required for
compliance audits (PCI DSS, GDPR, SOC 2, etc.). These scripts are intended to be run by the DevOps
team or as part of an automated CI/CD pipeline to generate reports that serve as evidence of control
effectiveness.

**Persona:** FinTech DevOps Engineer

## Overview

Automating evidence collection has several benefits:

- **Consistency:** Ensures that evidence is collected in the same way every time.
- **Efficiency:** Reduces the manual effort required to prepare for audits.
- **Timeliness:** Allows for continuous compliance monitoring rather than point-in-time checks.

## Scripts

- `aws_iam_mfa_check.sh`: Checks that all IAM users have MFA enabled.
- `aws_s3_encryption_check.sh`: Checks that all S3 buckets have server-side encryption enabled.
- `container_vulnerability_scan.sh`: A placeholder script that demonstrates how a container
  vulnerability scan could be integrated into the compliance process.

## Usage

These scripts are designed to be run from a shell with the AWS CLI installed and configured with
appropriate permissions.

**Example:**

```bash
./aws_iam_mfa_check.sh > evidence-reports/iam-mfa-report-$(date +%Y-%m-%d).txt
```
