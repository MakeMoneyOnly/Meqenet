# JWT Key Rotation Infrastructure
# This file defines the AWS infrastructure for automated JWT key rotation


# SNS Topic for key rotation alerts
resource "aws_sns_topic" "key_rotation_alerts" {
  name = "meqenet-key-rotation-alerts"

  tags = {
    Name        = "meqenet-key-rotation-alerts"
    Environment = var.environment
    Service     = "auth-service"
    Purpose     = "security-alerts"
  }
}

# SNS Topic subscription for email alerts
resource "aws_sns_topic_subscription" "key_rotation_email" {
  topic_arn = aws_sns_topic.key_rotation_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email

  depends_on = [aws_sns_topic.key_rotation_alerts]
}

# IAM Role for Lambda function
resource "aws_iam_role" "key_rotation_lambda_role" {
  name = "meqenet-key-rotation-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "meqenet-key-rotation-lambda-role"
    Environment = var.environment
    Service     = "auth-service"
  }
}

# IAM Policy for Lambda function
resource "aws_iam_role_policy" "key_rotation_lambda_policy" {
  name = "meqenet-key-rotation-lambda-policy"
  role = aws_iam_role.key_rotation_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:CreateSecret",
          "secretsmanager:TagResource",
          "secretsmanager:ListSecrets",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:meqenet-jwt-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:CreateKey",
          "kms:GenerateDataKeyPair",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = [
          var.kms_key_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.key_rotation_alerts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/meqenet-key-rotation:*"
        ]
      }
    ]
  })
}

# Lambda function for key rotation
resource "aws_lambda_function" "key_rotation" {
  filename         = data.archive_file.key_rotation_lambda_zip.output_path
  function_name    = "meqenet-key-rotation"
  role            = aws_iam_role.key_rotation_lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 256

  environment {
    variables = {
      AWS_REGION                    = var.aws_region
      KEY_ROTATION_INTERVAL_DAYS    = var.key_rotation_interval_days
      MAX_ACTIVE_KEYS              = var.max_active_keys
      KEY_PREFIX                   = var.key_prefix
      LOG_LEVEL                    = var.log_level
      ALERT_SNS_TOPIC_ARN         = aws_sns_topic.key_rotation_alerts.arn
    }
  }

  tags = {
    Name        = "meqenet-key-rotation-lambda"
    Environment = var.environment
    Service     = "auth-service"
    Purpose     = "security-key-rotation"
  }

  depends_on = [
    aws_iam_role_policy.key_rotation_lambda_policy,
    aws_cloudwatch_log_group.key_rotation_lambda_logs
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "key_rotation_lambda_logs" {
  name              = "/aws/lambda/meqenet-key-rotation"
  retention_in_days = 30

  tags = {
    Name        = "meqenet-key-rotation-lambda-logs"
    Environment = var.environment
    Service     = "auth-service"
  }
}

# CloudWatch Event Rule for daily scheduling
resource "aws_cloudwatch_event_rule" "key_rotation_schedule" {
  name                = "meqenet-key-rotation-daily"
  description         = "Daily schedule for JWT key rotation check"
  schedule_expression = var.key_rotation_schedule

  tags = {
    Name        = "meqenet-key-rotation-schedule"
    Environment = var.environment
    Service     = "auth-service"
  }
}

# CloudWatch Event Target to trigger Lambda
resource "aws_cloudwatch_event_target" "key_rotation_target" {
  rule      = aws_cloudwatch_event_rule.key_rotation_schedule.name
  target_id = "key-rotation-lambda"
  arn      = aws_lambda_function.key_rotation.arn
}

# Lambda permission for CloudWatch Events
resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.key_rotation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.key_rotation_schedule.arn
}

# CloudWatch Alarm for key rotation failures
resource "aws_cloudwatch_metric_alarm" "key_rotation_failure" {
  alarm_name          = "meqenet-key-rotation-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "KeyRotationFailure"
  namespace           = "Meqenet/AuthService"
  period             = "86400"  # 1 day
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "Alert when JWT key rotation fails"
  alarm_actions      = [aws_sns_topic.key_rotation_alerts.arn]

  dimensions = {
    Service = "KeyRotation"
  }

  tags = {
    Name        = "meqenet-key-rotation-failure-alarm"
    Environment = var.environment
    Service     = "auth-service"
  }
}

# CloudWatch Dashboard for key rotation monitoring
resource "aws_cloudwatch_dashboard" "key_rotation_dashboard" {
  dashboard_name = "meqenet-key-rotation-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["Meqenet/AuthService", "KeyRotationSuccess", "Service", "KeyRotation"],
            [".", "KeyRotationFailure", ".", "."],
            [".", "KeyRotationSkipped", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Key Rotation Operations"
          period  = 86400
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6

        properties = {
          query = "SOURCE '/aws/lambda/meqenet-key-rotation' | fields @timestamp, @message | sort @timestamp desc | limit 100"
          region = var.aws_region
          title  = "Key Rotation Logs"
        }
      }
    ]
  })
}

# Archive Lambda function code
data "archive_file" "key_rotation_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/key-rotation-function"
  output_path = "${path.module}/lambda/key-rotation-function.zip"

  depends_on = [
    # Ensure the Lambda code is ready before archiving
    null_resource.lambda_code_validation
  ]
}

# Validate Lambda code before deployment
resource "null_resource" "lambda_code_validation" {
  triggers = {
    lambda_code_hash = filemd5("${path.module}/lambda/key-rotation-function/index.js")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/lambda/key-rotation-function && npm install"
  }
}

# Variables for key rotation infrastructure
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "key_rotation_schedule" {
  description = "CloudWatch Events schedule expression for key rotation"
  type        = string
  default     = "rate(30 days)"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "alert_email" {
  description = "Email address for key rotation alerts"
  type        = string
  default     = "security@meqenet.et"
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  type        = string
  default     = ""
}

variable "key_rotation_interval_days" {
  description = "Number of days between key rotations"
  type        = number
  default     = 30
}

variable "max_active_keys" {
  description = "Maximum number of active keys to maintain"
  type        = number
  default     = 3
}

variable "key_prefix" {
  description = "Prefix for rotated keys"
  type        = string
  default     = "meqenet-jwt-"
}

variable "log_level" {
  description = "Log level for the Lambda function"
  type        = string
  default     = "INFO"
}

# AWS account ID is obtained from main.tf

# Outputs
output "key_rotation_lambda_arn" {
  description = "ARN of the key rotation Lambda function"
  value       = aws_lambda_function.key_rotation.arn
}

output "key_rotation_alerts_topic_arn" {
  description = "ARN of the SNS topic for key rotation alerts"
  value       = aws_sns_topic.key_rotation_alerts.arn
}

output "key_rotation_dashboard_url" {
  description = "URL of the CloudWatch dashboard for key rotation monitoring"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.key_rotation_dashboard.dashboard_name}"
}
