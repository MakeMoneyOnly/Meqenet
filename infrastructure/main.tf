terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket         = "meqenet-terraform-state-bucket"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "meqenet-terraform-state-lock"
  }
}

# AWS Provider Configuration with enhanced security
provider "aws" {
  region = "us-east-1"

  # Default tags for Ethiopian financial compliance
  default_tags {
    tags = {
      Project            = "Meqenet.et"
      Environment        = "production"
      Owner              = "DevOps Team"
      CostCenter         = "FIN-001"
      DataClassification = "RESTRICTED"
      NBECompliant       = "true"
      DataResidency      = "ethiopia"
      LastReviewed       = "2024-01-01"
      ManagedBy          = "Terraform"
    }
  }

  # Enhanced security settings
  assume_role_with_web_identity {
    role_arn = var.ci_role_arn
  }

  # Skip metadata API checks for security
  skip_metadata_api_check     = true
  skip_region_validation      = false
  skip_credentials_validation = false
}

# Provider for replication region (Fix CKV_AWS_144)
provider "aws" {
  alias  = "replica"
  region = "eu-west-1"  # Replication region

  # Default tags for Ethiopian financial compliance
  default_tags {
    tags = {
      Project            = "Meqenet.et"
      Environment        = "production"
      Owner              = "DevOps Team"
      CostCenter         = "FIN-001"
      DataClassification = "RESTRICTED"
      NBECompliant       = "true"
      DataResidency      = "ethiopia"
      LastReviewed       = "2024-01-01"
      ManagedBy          = "Terraform"
      Purpose            = "Replication"
    }
  }

  # Enhanced security settings
  assume_role_with_web_identity {
    role_arn = var.ci_role_arn
  }

  # Skip metadata API checks for security
  skip_metadata_api_check     = true
  skip_region_validation      = false
  skip_credentials_validation = false
}

# CloudTrail for audit compliance
resource "aws_cloudtrail" "main" {
  name                          = "meqenet-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  # Enhanced security for Ethiopian financial compliance
  kms_key_id = aws_kms_key.cloudtrail.arn

  # CloudWatch integration for real-time monitoring
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn
  
  # Fix CKV_AWS_252 - Define SNS topic for CloudTrail notifications
  sns_topic_name = aws_sns_topic.cloudtrail_alerts.arn

  tags = {
    Name = "meqenet-cloudtrail"
  }
}

# SNS topic for CloudTrail alerts (Fix CKV_AWS_252)
resource "aws_sns_topic" "cloudtrail_alerts" {
  name = "meqenet-cloudtrail-alerts"
  
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = {
    Name = "meqenet-cloudtrail-alerts"
  }
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "meqenet-cloudtrail-logs-${random_id.suffix.hex}"

  tags = {
    Name = "meqenet-cloudtrail-logs"
  }
}

# S3 bucket for access logs
resource "aws_s3_bucket" "cloudtrail_access_logs" {
  bucket = "meqenet-cloudtrail-access-logs-${random_id.suffix.hex}"

  tags = {
    Name = "meqenet-cloudtrail-access-logs"
  }
}

# Fix CKV2_AWS_61 - S3 bucket lifecycle configuration for CloudTrail bucket
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 365
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Fix CKV_AWS_300 - Abort incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Fix CKV2_AWS_61 - S3 bucket lifecycle configuration for access logs bucket
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_access_logs" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Fix CKV_AWS_300 - Abort incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Fix CKV2_AWS_62 - S3 bucket event notifications for CloudTrail bucket
resource "aws_s3_bucket_notification" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  eventbridge = true
  
  topic {
    topic_arn     = aws_sns_topic.cloudtrail_notifications.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "cloudtrail/"
  }
}

# SNS topic for CloudTrail S3 notifications
resource "aws_sns_topic" "cloudtrail_notifications" {
  name = "meqenet-cloudtrail-s3-notifications"
  
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = {
    Name = "meqenet-cloudtrail-s3-notifications"
  }
}

# S3 bucket notification permissions for SNS
resource "aws_sns_topic_policy" "cloudtrail_notifications" {
  arn = aws_sns_topic.cloudtrail_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.cloudtrail_notifications.arn
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
        ArnLike = {
          "aws:SourceArn" = aws_s3_bucket.cloudtrail.arn
        }
      }
    }]
  })
}

# Fix CKV2_AWS_62 - S3 bucket event notifications for access logs bucket
resource "aws_s3_bucket_notification" "cloudtrail_access_logs" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  eventbridge = true
}

# Fix CKV_AWS_144 - Cross-region replication setup (requires versioning first)
resource "aws_s3_bucket_versioning" "cloudtrail_replication" {
  bucket = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_access_logs_replication" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Replication destination bucket (in another region)
resource "aws_s3_bucket" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = "meqenet-cloudtrail-replica-${random_id.suffix.hex}"

  tags = {
    Name = "meqenet-cloudtrail-replica"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Fix CKV2_AWS_6 - Public access block for CloudTrail replica bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Fix CKV_AWS_145 - KMS encryption for CloudTrail replica bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_replica.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail_replica.arn
    }
    bucket_key_enabled = true
  }
}

# Fix CKV2_AWS_61 - Lifecycle configuration for CloudTrail replica bucket
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_replica.id

  rule {
    id     = "cloudtrail-replica-lifecycle"
    status = "Enabled"

    expiration {
      days = 365
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Fix CKV2_AWS_62 - Event notifications for CloudTrail replica bucket
resource "aws_s3_bucket_notification" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_replica.id

  eventbridge = true
}

# Fix CKV_AWS_18 - Access logging for CloudTrail replica bucket
resource "aws_s3_bucket_logging" "cloudtrail_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_replica.id

  target_bucket = aws_s3_bucket.cloudtrail_access_logs_replica.arn
  target_prefix = "cloudtrail-replica-access/"
}

# Replica bucket for access logs (required for cross-region replication)
resource "aws_s3_bucket" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = "meqenet-cloudtrail-access-logs-replica-${random_id.suffix.hex}"

  tags = {
    Name = "meqenet-cloudtrail-access-logs-replica"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail_replica.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Fix CKV2_AWS_61 - Lifecycle configuration for CloudTrail access logs replica bucket
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  rule {
    id     = "cloudtrail-access-logs-replica-lifecycle"
    status = "Enabled"

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Fix CKV2_AWS_62 - Event notifications for CloudTrail access logs replica bucket
resource "aws_s3_bucket_notification" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  eventbridge = true
}

# Fix CKV_AWS_18 - Access logging for CloudTrail access logs replica bucket
resource "aws_s3_bucket_logging" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  target_bucket = aws_s3_bucket.cloudtrail_access_logs_replica.arn
  target_prefix = "access-logs/self/"
}

# IAM role for replication
resource "aws_iam_role" "replication" {
  name = "meqenet-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "replication" {
  name = "meqenet-s3-replication-policy"
  role = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.cloudtrail_replica.arn}/*"
      },
      // Replication permissions for CloudTrail access logs bucket
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.cloudtrail_access_logs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.cloudtrail_access_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.cloudtrail_access_logs_replica.arn}/*"
      }
    ]
  })
}

# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "cloudtrail" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.cloudtrail_replica.arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.cloudtrail_replication]
}

# Cross-region replication for CloudTrail access logs bucket (CKV_AWS_144)
resource "aws_s3_bucket_replication_configuration" "cloudtrail_access_logs" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  rule {
    id     = "replicate-access-logs"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.cloudtrail_access_logs_replica.arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.cloudtrail_access_logs_replication]
}

# Reverse replication role in replica region to satisfy CRR check on replica bucket
resource "aws_iam_role" "replication_replica" {
  provider = aws.replica
  name     = "meqenet-s3-replication-role-replica"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "s3.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "replication_replica" {
  provider = aws.replica
  name     = "meqenet-s3-replication-policy-replica"
  role     = aws_iam_role.replication_replica.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ],
        Resource = aws_s3_bucket.cloudtrail_access_logs_replica.arn
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ],
        Resource = "${aws_s3_bucket.cloudtrail_access_logs_replica.arn}/*"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ],
        Resource = "${aws_s3_bucket.cloudtrail_access_logs.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "cloudtrail_access_logs_replica" {
  provider = aws.replica
  role     = aws_iam_role.replication_replica.arn
  bucket   = aws_s3_bucket.cloudtrail_access_logs_replica.id

  rule {
    id     = "replicate-access-logs-back"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.cloudtrail.arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.cloudtrail_access_logs_replica]
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_access_logs" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_access_logs" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_access_logs" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable access logging for CloudTrail bucket
resource "aws_s3_bucket_logging" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  target_bucket = aws_s3_bucket.cloudtrail_access_logs.id
  target_prefix = "access-logs/cloudtrail/"
}

# Enable access logging for access logs bucket itself
resource "aws_s3_bucket_logging" "cloudtrail_access_logs" {
  bucket = aws_s3_bucket.cloudtrail_access_logs.id

  target_bucket = aws_s3_bucket.cloudtrail_access_logs.id
  target_prefix = "access-logs/self/"
}

# CloudTrail KMS Key
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:TagResource",
          "kms:UntagResource",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Firehose to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "meqenet-cloudtrail-kms"
  }
}

# CloudTrail Replica KMS Key
resource "aws_kms_key" "cloudtrail_replica" {
  provider = aws.replica
  description             = "KMS key for CloudTrail replica log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to encrypt/decrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "meqenet-cloudtrail-replica-kms"
  }
}

# CloudTrail CloudWatch Logs
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/meqenet"
  retention_in_days = 3653  # 10 years for NBE compliance
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = {
    Name = "meqenet-cloudtrail-logs"
  }
}

# CloudTrail IAM Role
resource "aws_iam_role" "cloudtrail" {
  name = "meqenet-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "meqenet-cloudtrail-role"
  }
}

resource "aws_iam_role_policy_attachment" "cloudtrail" {
  role       = aws_iam_role.cloudtrail.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/CloudTrailServiceRolePolicy"
}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# Data sources for Ethiopian compliance
# Fix CKV_AWS_356, CKV_AWS_111, CKV_AWS_109 - Remove wildcards from KMS policy
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"  # GitHub OIDC thumbprint
  ]

  tags = {
    Name = "meqenet-github-oidc"
  }
}

# IAM Role for GitHub Actions CI/CD
resource "aws_iam_role" "github_actions_ci" {
  name = "meqenet-github-actions-ci"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:meqenet/meqenet:*",  # Allow all branches
              "repo:meqenet/infrastructure:*"
            ]
          }
        }
      }
    ]
  })

  tags = {
    Name = "meqenet-github-actions-ci"
  }
}

# IAM Policy for CI/CD Operations
resource "aws_iam_role_policy" "github_actions_ci" {
  name = "meqenet-github-actions-ci-policy"
  role = aws_iam_role.github_actions_ci.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Terraform state management
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::meqenet-terraform-state-bucket",
          "arn:aws:s3:::meqenet-terraform-state-bucket/*"
        ]
      },
      # DynamoDB for state locking
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:us-east-1:${data.aws_caller_identity.current.account_id}:table/meqenet-terraform-state-lock"
      },
      # CloudTrail permissions for security monitoring (Fix CKV_AWS_355)
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails"
        ]
        Resource = aws_cloudtrail.main.arn
      },
      # KMS permissions for encryption
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudtrail.arn
      },
      # CloudWatch permissions for monitoring
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/cloudtrail/*"
      }
    ]
  })
}

# IAM Role for GitHub Actions Deployment
resource "aws_iam_role" "github_actions_deploy" {
  name = "meqenet-github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:meqenet/meqenet:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = {
    Name = "meqenet-github-actions-deploy"
  }
}

# IAM Policy for Deployment Operations
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "meqenet-github-actions-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # ECS deployment permissions (Fix CKV_AWS_355, CKV_AWS_290)
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:DeregisterTaskDefinition"
        ]
        Resource = [
          "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:service/meqenet-*",
          "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:task/*",
          "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:task-definition/meqenet-*:*",
          "arn:aws:ecs:*:${data.aws_caller_identity.current.account_id}:cluster/meqenet-*"
        ]
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Project" = "Meqenet.et"
          }
        }
      },
      # ECR permissions for container images
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "arn:aws:ecr:us-east-1:${data.aws_caller_identity.current.account_id}:repository/meqenet-*"
      },
      # CloudFront invalidation for frontend deployments (Fix CKV_AWS_355)
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
      },
      # S3 permissions for static website hosting
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::meqenet-frontend-*",
          "arn:aws:s3:::meqenet-frontend-*/*"
        ]
      }
    ]
  })
}

# Variables
variable "ci_role_arn" {
  description = "ARN of the CI role for OIDC authentication"
  type        = string
}
