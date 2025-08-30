resource "aws_kms_key" "sns" {
  description             = "KMS key for encrypting SNS messages"
  deletion_window_in_days = 30

  tags = {
    Name = "meqenet-sns-kms-key"
  }
}

resource "aws_sns_topic" "main" {
  name = "meqenet-main-topic"

  # Enable encryption with customer-managed key
  kms_master_key_id = aws_kms_key.sns.id

  # Add delivery policy for better security
  delivery_policy = jsonencode({
    healthyRetryPolicy = {
      minDelayTarget     = 20
      maxDelayTarget     = 20
      numRetries         = 3
      numMaxDelayRetries = 0
      backoffFunction    = "linear"
    }
  })

  tags = {
    Name = "meqenet-sns-topic"
  }
}

resource "aws_kms_key" "sqs" {
  description             = "KMS key for encrypting SQS messages"
  deletion_window_in_days = 30

  tags = {
    Name = "meqenet-sqs-kms-key"
  }
}

resource "aws_sqs_queue" "main" {
  name = "meqenet-main-queue"

  # Enable encryption with customer-managed key
  kms_master_key_id = aws_kms_key.sqs.id

  # Security settings
  delay_seconds             = 0
  max_message_size         = 262144  # 256KB
  message_retention_seconds = 345600  # 4 days
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 30

  # Add redrive policy for dead letter queue handling
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.main_dlq.arn
    maxReceiveCount     = 5
  })

  tags = {
    Name = "meqenet-sqs-queue"
  }
}

# Dead letter queue for better error handling
resource "aws_sqs_queue" "main_dlq" {
  name = "meqenet-main-queue-dlq"

  # Enable encryption with customer-managed key
  kms_master_key_id = aws_kms_key.sqs.id

  message_retention_seconds = 1209600  # 14 days

  tags = {
    Name = "meqenet-sqs-dlq"
  }
}

resource "aws_sns_topic_subscription" "main_queue_subscription" {
  topic_arn = aws_sns_topic.main.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.main.arn
}

# SQS access policy to allow SNS to send messages
resource "aws_sqs_queue_policy" "main_queue_policy" {
  queue_url = aws_sqs_queue.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.main.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.main.arn
          }
        }
      }
    ]
  })
}
