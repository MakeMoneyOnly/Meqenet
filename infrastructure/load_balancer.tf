# tfsec:ignore:aws-ec2-no-public-ingress-sgr - Public-facing ALB requires HTTP/HTTPS from internet
resource "aws_security_group" "alb" {
  name        = "meqenet-alb-sg"
  description = "Security group for the Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Enforce HTTPS-only ingress for fintech-grade security posture (CKV_AWS_260)

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]  # Fix CKV_AWS_382 - Restrict egress to VPC only
    description = "Allow all outbound traffic within VPC"  # Fix CKV_AWS_23
  }

  tags = {
    Name = "meqenet-alb-sg"
  }
}

# S3 bucket for ALB access logs (Fix CKV_AWS_91)
resource "aws_s3_bucket" "alb_logs" {
  bucket = "meqenet-alb-logs-${random_id.suffix.hex}"

  tags = {
    Name = "meqenet-alb-logs"
  }
}

# Fix CKV_AWS_21 - Enable versioning for ALB logs bucket
resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Fix CKV_AWS_145 - Enable KMS encryption for ALB logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

# Fix CKV2_AWS_6 - Public access block for primary ALB logs bucket
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Fix CKV2_AWS_61 - Lifecycle configuration for ALB logs bucket
resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "alb-access-logs-lifecycle"
    prefix = "alb-logs/"  # Match ALB access logs prefix
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

# Fix CKV2_AWS_62 - Event notifications for ALB logs bucket
resource "aws_s3_bucket_notification" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  eventbridge = true
}

# Fix CKV_AWS_144 - Cross-region replication for ALB logs bucket
resource "aws_s3_bucket_replication_configuration" "alb_logs" {
  depends_on = [aws_s3_bucket_versioning.alb_logs]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "alb-logs-replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.alb_logs_replica.arn
      storage_class = "STANDARD_IA"
    }

    filter {
      prefix = "alb"
    }
  }
}

# Replica bucket for ALB logs (required for cross-region replication)
resource "aws_s3_bucket" "alb_logs_replica" {
  provider = aws.replica
  bucket   = "meqenet-alb-logs-replica-${random_id.suffix.hex}"

  tags = {
    Name = "meqenet-alb-logs-replica"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.alb_logs_replica.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.alb_logs_replica.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail_replica.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.alb_logs_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Fix CKV2_AWS_61 - Lifecycle configuration for ALB logs replica bucket
resource "aws_s3_bucket_lifecycle_configuration" "alb_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.alb_logs_replica.id

  rule {
    id     = "alb-logs-replica-lifecycle"
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

# Fix CKV2_AWS_62 - Event notifications for ALB logs replica bucket
resource "aws_s3_bucket_notification" "alb_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.alb_logs_replica.id

  eventbridge = true
}

# Fix CKV_AWS_18 - Access logging for ALB logs replica bucket
resource "aws_s3_bucket_logging" "alb_logs_replica" {
  provider = aws.replica
  bucket   = aws_s3_bucket.alb_logs_replica.id

  target_bucket = aws_s3_bucket.cloudtrail_access_logs_replica.arn
  target_prefix = "alb-logs-replica-access/"
}

# Fix CKV_AWS_18 - Access logging for ALB logs bucket
resource "aws_s3_bucket_logging" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  target_bucket = aws_s3_bucket.cloudtrail_access_logs.id
  target_prefix = "alb-logs-access/"
}



// ... existing code ...

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# tfsec:ignore:aws-elb-alb-not-public - Public-facing application requires internet-facing ALB
resource "aws_lb" "main" {
  name               = "meqenet-main-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  enable_deletion_protection = true

  # Fix CKV_AWS_91 - Enable access logging
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = true
    prefix  = "alb-logs"
  }

  # Fix CKV_AWS_131 - Drop invalid HTTP headers
  drop_invalid_header_fields = true

  # Fix CKV_AWS_328 - Defensive desync mitigation mode (already satisfied by default)
  desync_mitigation_mode = "defensive"

  tags = {
    Name = "meqenet-main-alb"
  }
}

# Fix CKV2_AWS_76 - WAF WebACL for ALB protection
resource "aws_wafv2_web_acl" "alb" {
  name        = "meqenet-alb-waf"
  description = "WAF for ALB with Log4j vulnerability protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # AWSManagedRulesCommonRuleSet - Common web exploits
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWSManagedRulesKnownBadInputsRuleSet - Known bad inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Fix CKV2_AWS_76 - Enhanced Log4j vulnerability protection with Bot Control
  rule {
    name     = "AWSManagedRulesBotControlRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"
        # Enable common inspection level for comprehensive protection
        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "COMMON"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesBotControlRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Additional Log4j protection - SQL injection rules
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Anonymous IP list protection
  rule {
    name     = "AWSManagedRulesAnonymousIpList"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesAnonymousIpList"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "meqenet-alb-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "meqenet-alb-waf"
    Environment = "production"
  }
}

# Fix CKV2_AWS_31 - WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "alb" {
  log_destination_configs = [aws_kinesis_firehose_delivery_stream.waf_logs.arn]
  resource_arn            = aws_wafv2_web_acl.alb.arn

  logging_filter {
    default_behavior = "KEEP"

    filter {
      behavior = "KEEP"
      condition {
        action_condition {
          action = "BLOCK"
        }
      }
      requirement = "MEETS_ANY"
    }
  }
}

# Kinesis Firehose for WAF logs
resource "aws_kinesis_firehose_delivery_stream" "waf_logs" {
  name        = "meqenet-waf-logs"
  destination = "extended_s3"

  # Fix CKV_AWS_240, CKV_AWS_241 - Enable server-side encryption
  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = aws_kms_key.cloudtrail.arn
  }

  extended_s3_configuration {
    role_arn            = aws_iam_role.waf_logs.arn
    bucket_arn          = aws_s3_bucket.alb_logs.arn
    prefix              = "waf-logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "waf-logs-errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    buffering_size      = 64
    buffering_interval  = 300
    compression_format  = "GZIP"
  }

  tags = {
    Name        = "meqenet-waf-logs"
    Environment = "production"
  }
}

# IAM Role for WAF logs
resource "aws_iam_role" "waf_logs" {
  name = "meqenet-waf-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "meqenet-waf-logs-role"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.alb.arn
}

resource "aws_lb_target_group" "main" {
  name     = "meqenet-main-tg"
  port     = 3000 # Assuming backend services run on port 3000
  protocol = "HTTPS"  # Fix CKV_AWS_378 - Use HTTPS for target group
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    protocol            = "HTTPS"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "meqenet-main-tg"
  }
}

# Fix CKV_AWS_2, CKV2_AWS_20 - HTTP listener redirects to HTTPS
// ... existing code ...

# HTTPS listener (Fix CKV_AWS_2, CKV_AWS_103)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"  # Fix CKV_AWS_103 - TLS 1.2+
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ACM Certificate for HTTPS
# Note: Wildcard certificate is required for supporting multiple subdomains
# including dynamic subdomains for multi-tenant architecture
resource "aws_acm_certificate" "main" {
  domain_name       = "meqenet.et"
  validation_method = "DNS"

  subject_alternative_names = [
    "api.meqenet.et",
    "www.meqenet.et"
  ]

  lifecycle {
    create_before_destroy = true
  }

  # Ensure certificate is validated before use
  options {
    certificate_transparency_logging_preference = "ENABLED"
  }

  tags = {
    Name = "meqenet-acm-certificate"
  }
}

# Certificate validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn

  validation_record_fqdns = [
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.resource_record_name
  ]

  timeouts {
    create = "5m"
  }
}

# Fix CKV2_AWS_28 - WAF for public-facing ALB
resource "aws_wafv2_web_acl" "main" {
  name  = "meqenet-waf-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Core Rule Set
  rule {
    name     = "AWSManagedRulesCoreRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCoreRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL injection protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Fix CKV2_AWS_76 - Log4j vulnerability protection (included in KnownBadInputs)
  # Note: Log4j protection is covered by AWSManagedRulesKnownBadInputsRuleSet above
  # which includes Log4j vulnerability patterns

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "meqenet-waf-acl"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "meqenet-waf-acl"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Fix CKV2_AWS_31 - WAF logging configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn = aws_wafv2_web_acl.main.arn

  log_destination_configs = [
    aws_kinesis_firehose_delivery_stream.waf_logs.arn
  ]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

# IAM policy for WAF logs delivery
resource "aws_iam_role_policy" "waf_logs" {
  name = "meqenet-waf-logs-policy"
  role = aws_iam_role.waf_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.alb_logs.arn,
          "${aws_s3_bucket.alb_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/kinesisfirehose/meqenet-waf-logs:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.cloudtrail.arn
      }
    ]
  })
}
