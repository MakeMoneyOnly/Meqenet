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
  }

  backend "s3" {
    bucket         = "meqenet-terraform-state-bucket"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "meqenet-terraform-state-lock"

    # Enable versioning for state file recovery
    versioning = true
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

  tags = {
    Name = "meqenet-cloudtrail"
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

  policy = data.aws_iam_policy_document.cloudtrail_kms.json

  tags = {
    Name = "meqenet-cloudtrail-kms"
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
data "aws_iam_policy_document" "cloudtrail_kms" {
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "Allow CloudTrail to encrypt logs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudtrail.main.arn]
    }
  }

  statement {
    sid    = "Allow CloudWatch Logs to encrypt logs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logs.amazonaws.com"]
    }
    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudwatch_log_group.cloudtrail.arn]
    }
  }
}

data "aws_caller_identity" "current" {}

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
      # CloudTrail permissions for security monitoring
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails"
        ]
        Resource = "*"
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
      # ECS deployment permissions
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
        Resource = "*"
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
      # CloudFront invalidation for frontend deployments
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "*"
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
  default     = aws_iam_role.github_actions_ci.arn
}
