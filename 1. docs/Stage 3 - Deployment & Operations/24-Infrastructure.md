# Infrastructure Architecture & Configuration (Meqenet BNPL Platform)

## Overview

This document details the cloud infrastructure architecture powering the Meqenet comprehensive BNPL
financial ecosystem, designed for modern FinTech operations. It focuses on AWS services,
infrastructure-as-code approaches, and best practices for security, scalability, and reliability
across all ecosystem components, **designed in accordance with enterprise FinTech standards, NBE
guidelines, Ethiopian data protection laws, financing terms compliance, our Microservice
Architecture, and modern security frameworks.**

The infrastructure is designed to support our independently deployable microservices:

- **Core Services**: Payments, Authentication, Users, KYC
- **Business Services**: Marketplace, Rewards, Premium Features
- **Supporting Services**: Virtual Cards, QR Payments, Analytics & AI

> **Related Documentation:**
>
> - [Deployment](./23-Deployment.md): Deployment workflows for our microservices
> - [Monitoring and Logging](./25-Monitoring_And_Logging.md): Observability configuration and NBE
>   compliance
> - [Security](../Stage%201%20-%20Foundation/07-Security.md): Security standards and NBE compliance
> - [Business Model](../Stage%201%20-%20Foundation/03-Business_Model.md): Complete business model
>   with all payment options
> - [Architecture](../Stage%201%20-%20Foundation/08-Architecture.md): Microservice Architecture
>   implementation
> - `.cursorrules`: Core security and quality coding standards for our project.

## 1. Infrastructure Architecture

### High-Level Microservice Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AWS Cloud - Meqenet.et Platform                 │
│                                                                        │
│  ┌────────────┐   ┌──────────────────────────────────────────────────┐ │
│  │ Route 53   │   │                     VPC                          │ │
│  │ DNS (.et)  │───►│  ┌───────────┐      ┌────────────────────────┐   │ │
│  └────────────┘   │  │   ALB /   │      │    EKS Cluster         │   │ │
│                   │  │API Gateway│◄─────┤ ┌──────────────────┐   │   │ │
│  ┌────────────┐   │  └─────┬─────┘      │ │┌────────────────┐│   │   │ │
│  │ CloudFront │   │        │            │ ││ Service Mesh   ││   │   │ │
│  │ (for FE)   ├◄──┘        │            │ ││ (e.g., Istio)  ││   │   │ │
│  └────────────┘   │        │            │ │└────────────────┘│   │   │ │
│                   │        │            │ │ Service A │◄─►│ Service B ││   │ │
│                   │        │            │ │ ┌─────────┐   ┌─────────┐│   │ │
│                   │        └────────────► │ │ Pod, Pod  │   │ Pod, Pod  ││   │ │
│                   │                     │ │ └─────────┘   └─────────┘│   │ │
│  ┌────────────┐   │                     │ │     │             │      │   │ │
│  │   WAF      │   │                     │ │     ▼             ▼      │   │ │
│  └────────────┘   │                     │ │ ┌─────────┐   ┌─────────┐│   │ │
│                   │                     │ │ │ DB A    │   │ DB B    ││   │ │
│                   │                     │ │ └─────────┘   └─────────┘│   │ │
│                   │                     │ └──────────────────┘   │   │ │
│                   │                     └────────────────────────┘   │ │
│                   │                                                  │ │
└────────────────────────────────────────────────────────────────────────┘
```

### Network Architecture (Ethiopian Context)

- **VPC Configuration:**
  - Region: Chosen AWS region based on NBE data localization rules and latency to Ethiopia.
  - CIDR Block: `10.0.0.0/16` (Example)
  - Multiple Availability Zones (minimum 2-3 for production within the chosen region)
  - Public and Private Subnets
  - NAT Gateways for private subnet outbound connectivity
  - VPC Flow Logs enabled for security monitoring and NBE-compliant auditing
  - VPC Endpoints for AWS services to maintain private communication
  - Network segmentation aligned with NBE security requirements.

- **Subnet Layout:**
  - Public Subnets: For ALB, NAT Gateways
  - Private App Subnets: For EKS nodes
  - Private Data Subnets: For RDS, ElastiCache (Potentially subject to NBE data location rules)
  - (Optional) Dedicated subnets if specific NBE rules require further isolation for payment
    processing logic.

- **Security Groups:**
  - ALB SG: Allows HTTP/HTTPS from internet (potentially restricted to Ethiopian IP ranges if
    feasible/required).
  - EKS Node SG: Allows traffic from ALB SG and internal traffic.
  - Database SG: Allows traffic only from EKS Node SG on specific ports.
  - Payment Integration SG: Highly restricted, allows only necessary traffic to/from Ethiopian
    payment provider endpoints (e.g., Telebirr API).

## 2. Core Infrastructure Components

### Compute (EKS - Elastic Kubernetes Service)

- **Cluster Configuration:**
  - Kubernetes Version: 1.28+
  - Control Plane: AWS-managed in multiple AZs
  - Logging: Control plane logs sent to CloudWatch
  - API Server Endpoint: Private (accessed via bastion or VPN)
  - Enhanced security policies for PCI compliance

- **Node Groups:**
  - General Purpose: t3.medium/t3.large (Dev/Staging), m5.large (Production)
  - Payment Processing: Dedicated node group with additional security controls
  - Auto-scaling: min=3, max=10 nodes (Production)
  - Launch Template with hardened AMI
  - EBS volumes with encryption (gp3)

- **Add-ons:**
  - AWS Load Balancer Controller
  - Cluster Autoscaler
  - AWS VPC CNI
  - CoreDNS
  - External DNS (for Route53 integration)
  - Metrics Server
  - Node Termination Handler
  - Calico (for network policies)
  - AWS Security Hub integration

### Storage

- **RDS (PostgreSQL):**
  - Instance Type: db.t3.medium (Dev/Staging), db.m5.large (Production)
  - Multi-AZ: Enabled in Production for high availability and automatic failover
  - Storage: 100GB gp3 (expandable) - Ensure sufficient IOPS for ETB transaction volume.
  - Automated Backups: Daily, retention period aligned with NBE regulations (e.g., 7+ years for
    financial records).
  - Point-in-Time Recovery: Enabled
  - Maintenance Window: Non-business hours
  - Parameter Group: Custom optimized for financial workload
  - Encryption: AWS KMS with dedicated keys, meeting NBE encryption standards.
  - Audit Logging: Enabled and configured per NBE requirements.

- **ElastiCache (Redis):**
  - Node Type: cache.t3.small (Dev/Staging), cache.m5.large (Production)
  - Multi-AZ: Enabled in Production with automatic failover for resilience
  - Encryption: At-rest and in-transit enabled
  - AUTH token: Required
  - Security Group: Restricted access
  - Used for: Session management, rate limiting, and caching (no sensitive financial data)

- **S3 Buckets:**
  - Static Content Bucket: Stores web/mobile assets, public read.
  - KYC Document Bucket: Stores encrypted Fayda/Passport images, private with strict access control,
    retention aligned with NBE/AML rules.
  - Transaction Records Bucket: Encrypted, immutable storage for ETB transaction records (consider
    Object Lock).
  - Audit Logs Bucket: Stores access and security logs (CloudTrail, VPC Flow Logs, etc.), private
    with strict access control, retention aligned with NBE rules.
  - Feature Configuration:
    - Versioning: Enabled.
    - Lifecycle Policies: Archive/delete data according to NBE retention requirements.
    - Encryption: SSE-KMS with dedicated keys.
    - Region: Ensure buckets storing sensitive Ethiopian user data comply with NBE data localization
      rules.

### Networking & Content Delivery

- **Route 53:**
  - Hosted Zone for domain (consider `.et` TLD if applicable).
  - Health Checks for critical endpoints accessible from Ethiopia.
  - Latency-based routing (if using multiple regions) or simple routing if single region.

- **Application Load Balancer (ALB):**
  - Internet-facing for public APIs and web frontend
  - Internal for private services
  - HTTP to HTTPS redirection
  - SSL/TLS termination with AWS Certificate Manager (TLS 1.2+ only)
  - Web ACL integration with AWS WAF
  - Access Logs enabled and stored in S3

- **CloudFront:**
  - Distribution for static assets (S3 origin).
  - Optimize cache behaviors for Ethiopian user access patterns.
  - Select appropriate price class / edge locations for best performance in Ethiopia/East Africa.
  - Custom domain with SSL certificate
  - Edge caching with appropriate TTLs
  - Origin request policies to optimize caching
  - Field-level encryption for sensitive data
  - Geo-restriction capabilities (potentially restrict access primarily to Ethiopia).

- **WAF (Web Application Firewall):**
  - OWASP Top 10 protection ruleset.
  - Rate-based rules tuned for expected Ethiopian traffic patterns.
  - Consider managed rules specific to financial sector or regional threats.
  - Attached to the public-facing API Gateway/ALB.

## 3. Security & Access Control

_Note: All configurations implement the principle of least privilege, secure defaults, and align
with NBE security directives, Ethiopian data protection laws, and `.cursorrules`._

- **IAM (Identity & Access Management):**
  - Role-based access control (RBAC) with strict segregation of duties (e.g., separating deployment
    from data access).
  - Service roles configured with minimum necessary permissions
  - MFA enforced for all human users
  - Temporary credentials used for CI/CD processes with short expiration
  - Regular access review process implemented
  - Permission boundaries to limit maximum permissions
  - SCPs (Service Control Policies) to enforce organization-wide guardrails

- **Secrets Management:**
  - AWS Secrets Manager utilized for all application secrets (API keys for Telebirr, Didit, etc., DB
    passwords).
  - Automatic rotation configured on strict schedules
  - KMS integration for enhanced encryption
  - Access tightly controlled via IAM policies
  - Audit logging for all secret access events

- **Data Protection:**
  - All data encrypted at rest (EBS, RDS, S3, ElastiCache) using AWS KMS, meeting NBE standards.
  - All data encrypted in transit (TLS 1.2+ only).
  - S3 bucket policies enforce private access unless explicitly public.
  - VPC endpoints used for private AWS service access.
  - Adherence to Ethiopian data protection laws for PII handling.

- **Network Security:**
  - Security groups act as stateful firewalls, allowing only necessary traffic (aligned with NBE
    guidelines).
  - Network ACLs provide stateless, subnet-level filtering as an additional layer
  - No direct SSH access; use SSM Session Manager with enhanced logging
  - VPC Flow Logs enabled and monitored for suspicious activity
  - Network traffic inspection for sensitive data
  - Strict segmentation of cardholder data environment (CDE)

- **Compliance Monitoring:**
  - AWS Config Rules mapped to NBE security and operational requirements.
  - AWS Security Hub for security posture management (check for NBE compliance packs if available).
  - GuardDuty for threat detection
  - CloudTrail for comprehensive audit logging _(Key metrics: API call volumes, access patterns)_
  - VPC Flow Logs enabled for network traffic analysis and auditing _(Key metrics: Traffic volume,
    denied connections)_
  - Automatic remediation for specific compliance violations
  - Regular vulnerability scanning and penetration testing

## 4. Infrastructure as Code (IaC)

### Terraform Configuration

Our infrastructure is managed with Terraform (_chosen for its mature ecosystem, declarative syntax,
multi-cloud capabilities (future-proofing), and strong community support_) to ensure consistency,
repeatability, and documentation of all cloud resources, **including configurations specific to NBE
compliance and the Ethiopian operating environment.**

- **Repository Structure:**

  ```
  terraform/
  ├── environments/
  │   ├── dev/
  │   ├── staging/
  │   └── production/
  ├── modules/
  │   ├── networking/
  │   ├── database/
  │   ├── kubernetes/
  │   ├── storage/
  │   ├── security/
  │   └── compliance/
  └── global/
      ├── iam/
      ├── dns/
      └── security-controls/
  ```

- **State Management:**
  - Terraform state stored in S3 bucket with versioning
  - State locking via DynamoDB
  - Separate state files per environment
  - State file encryption
  - Access logging for state operations

- **Module Example (VPC with NBE Compliance Considerations):**

  ```hcl
  module "vpc" {
    source = "terraform-aws-modules/vpc/aws"
    version = "5.0.0" // Use a recent version

    name = "meqenet-${var.environment}-vpc"
    cidr = "10.0.0.0/16" // Example CIDR

    azs             = slice(data.aws_availability_zones.available.names, 0, 3) // Use available AZs in the chosen region
    private_subnets = [for k, v in data.aws_availability_zones.available.names : cidrsubnet("10.0.0.0/16", 8, k + 10)] // Example dynamic private subnets
    public_subnets  = [for k, v in data.aws_availability_zones.available.names : cidrsubnet("10.0.0.0/16", 8, k + 0)] // Example dynamic public subnets
    database_subnets = [for k, v in data.aws_availability_zones.available.names : cidrsubnet("10.0.0.0/16", 8, k + 20)] // Example dynamic database subnets

    enable_nat_gateway = true
    single_nat_gateway = false // Multiple NAT gateways for HA
    # enable_vpn_gateway = false // Only if VPN needed

    # Flow logs for security monitoring (NBE Requirement)
    enable_flow_log                      = true
    create_flow_log_cloudwatch_log_group = true
    flow_log_max_aggregation_interval    = 60

    # VPC Endpoints for secure AWS service access (Good practice, may support NBE goals)
    enable_s3_endpoint       = true
    enable_dynamodb_endpoint = true // If using DynamoDB
    enable_ecr_api_endpoint  = true
    # Add other endpoints as needed (e.g., KMS, Secrets Manager)

    tags = {
      Environment = var.environment
      Project     = "meqenet-ethiopia"
      Compliance  = "nbe"
      ManagedBy   = "terraform"
    }
  }
  ```

- **Compliance Monitoring:**
  - AWS Config Rules mapped to NBE security and operational requirements.
  - AWS Security Hub for security posture management (check for NBE compliance packs if available).
  - GuardDuty for threat detection
  - CloudTrail for comprehensive audit logging _(Key metrics: API call volumes, access patterns)_
  - VPC Flow Logs enabled for network traffic analysis and auditing _(Key metrics: Traffic volume,
    denied connections)_
  - Automatic remediation for specific compliance violations

## 5. Payment Processing Infrastructure (Ethiopian Providers)

### Payment Gateway Integration

- **Secure Payment Processing:**
  - Dedicated infrastructure components (e.g., specific K8s pods/services) for handling interactions
    with Ethiopian payment providers (Telebirr, HelloCash, etc.).
  - End-to-end encryption for payment-related data.
  - Secure handling of API keys/credentials for each provider via AWS Secrets Manager.
  - No storage of sensitive provider credentials or raw payment details unless absolutely necessary
    and compliant with NBE rules.

- **Compliance Focus (NBE):**
  - Ensure integration methods align with NBE security standards for third-party connections.
  - Network segmentation to isolate payment integration components.
  - Strict access controls for services interacting with payment providers.

- **Transaction Processing Redundancy:**
  - Potential for multi-provider strategy (e.g., Telebirr as primary, HelloCash as fallback) if
    business requirements dictate.
  - Fallback mechanisms defined in application logic.
  - Circuit breakers to prevent cascading failures during provider outages.

### Financial Data Storage (NBE Alignment)

- **Data Classification:**
  - Cardholder Data (CHD): Highest security level, tokenized where possible
  - Personally Identifiable Information (PII): High security level, encrypted at rest and in transit
  - Financial Transaction Data: High security level, encrypted and immutable
  - Application Data: Standard security level

- **Data Lifecycle Management:**
  - Retention policies based on NBE regulations (e.g., 7+ years for financial records).
  - Secure data deletion processes compliant with Ethiopian laws.

## 6. Disaster Recovery & Business Continuity (Ethiopian Context)

- **Recovery Time Objectives (RTO):**
  - Payment Processing (via Ethiopian Providers): < 30 minutes (factor in provider dependencies)

- **Recovery Point Objectives (RPO):**
  - Financial Transactions (ETB): < 1 minute (near-zero data loss)

- **Backup Strategy:**
  - Database: Point-in-time recovery with transaction logs (Backups stored according to NBE rules,
    potentially within specific regions).

- **Multi-Region Considerations (If Applicable):**
  - Primary Region: Chosen based on NBE rules/latency. _(Note: Final region choice, e.g.,
    `af-south-1` or other suitable region, pending confirmation of specific NBE rules and latency
    tests.)_
  - DR Region: Chosen based on NBE rules, latency, and AWS service availability.
  - Data replication strategy must comply with NBE data localization rules.

## 7. Compliance & Security Automation (NBE Focus)

- **Continuous Compliance Checks:**
  - AWS Config Rules mapped to NBE security and operational requirements.

## 8. Mobile App Infrastructure (Ethiopian Considerations)

- **Push Notification Service:**
  - AWS SNS for cross-platform push notifications (ensure reliability to Ethiopian networks).

## 9. Cost Optimization Strategy (Ethiopian Market)

- **Reserved Instances:**
  - RDS and ElastiCache instances on 1-year reservations
  - EC2/EKS compute with combination of Reserved Instances and Spot Instances for non-critical
    workloads

- **Autoscaling Policies:**
  - Time-based scaling for predictable patterns
  - Load-based dynamic scaling
  - Scale-to-zero for development environments

- **Resource Rightsizing:**
  - Regular review of resource utilization based on actual Ethiopian user load.

- **Storage Optimization:**
  - S3 Lifecycle Policies for tiered storage (consider NBE retention rules).
  - RDS storage autoscaling with thresholds
  - Data retention policies aligned with NBE requirements.
