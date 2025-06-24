# 27. Disaster Recovery Plan

## 1. Overview

This document describes the strategy and procedures for recovering Meqenet's critical systems in the
event of a large-scale disaster, such as the failure of an entire AWS Availability Zone (AZ) or
Region. This plan is designed for our microservice architecture, focusing on restoring service
incrementally and maintaining data consistency across distributed services.

## 2. Key Objectives

- **Recovery Time Objective (RTO)**: The target time within which a business process must be
  restored after a disaster.
  - **Critical Services (Payments, Auth, Users)**: `< 1 hour`
  - **Non-Critical Services**: `< 4 hours`
- **Recovery Point Objective (RPO)**: The maximum acceptable amount of data loss, measured in time.
  - **Core Financial Data**: `< 5 minutes`
  - **Other Data**: `< 1 hour`

## 3. Disaster Recovery Scenarios

| Scenario                           | Description                                            | Impact                                              | Recovery Strategy                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single Service Failure**         | A single microservice becomes completely unresponsive. | Limited to the service's domain.                    | Handled by Kubernetes self-healing (pod restarts) and our standard [Incident Response Plan](./26-Incident_Response_Plan.md). Not a DR event.                                                                               |
| **Database Failure**               | The primary database for a critical service fails.     | The service and its dependents are down.            | Failover to the multi-AZ standby replica in RDS. This is an automated process with minimal downtime.                                                                                                                       |
| **Availability Zone (AZ) Failure** | An entire AWS AZ becomes unavailable.                  | High. ~50% of our infrastructure could be affected. | Our EKS cluster, RDS instances, and ElastiCache are already deployed across multiple AZs. Kubernetes and AWS will automatically shift traffic to healthy AZs. The DR plan is activated to monitor and manage this process. |
| **Region Failure**                 | The entire primary AWS region is down.                 | Critical. Full system outage.                       | This is the primary disaster scenario. We will execute a cross-region failover to our designated DR region.                                                                                                                |

## 4. Cross-Region Failover Strategy (Active-Passive)

Our primary strategy is an active-passive model with a "pilot light" approach for cost efficiency.

- **Primary Region**: The active region serving all production traffic.
- **DR Region (Disaster Recovery)**: A passive region with a scaled-down, "pilot light" copy of our
  infrastructure.

### Failover Process

1.  **Declaration**: The Incident Commander declares a regional disaster after confirming the outage
    with AWS support and our own monitoring.
2.  **Scale-Up DR Infrastructure**:
    - Use Terraform to scale up the EKS cluster, RDS instances, and other core components in the DR
      region to production capacity.
    - Run pre-configured scripts to match production-level autoscaling rules.
3.  **Data Restoration**:
    - **PostgreSQL (RDS)**: Promote the cross-region read replica in the DR region to become the new
      primary database. This provides low RPO.
    - **S3**: Use Cross-Region Replication (CRR) for critical buckets (e.g., KYC documents). Data
      will be available in the DR region automatically.
    - **Data Consistency**: For transactions that were in-flight, we will rely on asynchronous Saga
      patterns to eventually reconcile state once both regions are stable. Initial recovery focuses
      on restoring read/write capability.
4.  **DNS Failover**:
    - Update the Route 53 DNS records to point all traffic from the primary region's API Gateway/ALB
      to the one in the DR region. This is a manual, weighted record change.
5.  **Service Deployment**:
    - Our CI/CD pipeline will be triggered to deploy the latest versions of all microservices to the
      newly scaled-up EKS cluster in the DR region.
6.  **Validation**:
    - The team performs health checks and runs critical-path synthetic tests to validate that the
      system is fully functional in the DR region.
7.  **Communication**: The Comms Lead provides updates to users via the status page.

## 5. Data Backup & Restoration

- **RDS**: Automated daily snapshots are taken and copied to the DR region. Point-in-Time Recovery
  (PITR) is enabled.
- **S3**: Versioning is enabled on all critical buckets, and Cross-Region Replication is active.
- **Configuration**: All infrastructure is defined as code (Terraform), and all Kubernetes manifests
  are stored in Git. These are the sources of truth for restoration.

## 6. DR Testing

- **Frequency**: A full DR failover test will be conducted **annually**.
- **Process**: A test environment, which is a mirror of production, will be used. The team will
  simulate a regional outage and execute the full failover and failback procedure.
- **Validation**: The test is successful if the system is fully operational in the DR region within
  the defined RTO and data loss is within the RPO.
- **Reporting**: A report detailing the test results, any issues found, and remediation plans will
  be shared with all stakeholders.

## 7. Failback Procedure

Once the primary region is restored, a planned failback will be executed during a maintenance
window. The process involves replicating data back to the primary region and then reversing the DNS
failover.
