# Meqenet.et - Multi-Region Disaster Recovery Playbook

## Document Information

- **Version**: 2.1
- **Last Updated**: January 2024
- **Classification**: RESTRICTED (NBE Compliance)
- **Owner**: DevOps Team
- **Review Cycle**: Quarterly

## Executive Summary

This playbook outlines the disaster recovery (DR) procedures for the Meqenet.et BNPL platform,
ensuring business continuity and compliance with Ethiopian financial regulations. The platform
implements a multi-region active-active architecture with automated failover capabilities.

**Recovery Objectives:**

- **RTO (Recovery Time Objective)**: 15 minutes for critical services, 4 hours for full platform
- **RPO (Recovery Point Objective)**: 5 minutes for transaction data, 15 minutes for analytical data

## 1. Architecture Overview

### Primary Regions

- **Region 1**: EU-West-1 (Ireland) - Primary Production
- **Region 2**: EU-Central-1 (Frankfurt) - Secondary Production

### Services Distribution

```
EU-West-1 (Primary)
├── API Gateway (Active)
├── Auth Service (Active)
├── Payment Processing (Active)
├── Database (Primary)
└── Redis Cache (Primary)

EU-Central-1 (Secondary)
├── API Gateway (Standby)
├── Auth Service (Standby)
├── Payment Processing (Standby)
├── Database (Read Replica)
└── Redis Cache (Replica)
```

## 2. Monitoring & Alerting

### Health Checks

- **Application Level**: Kubernetes liveness/readiness probes
- **Infrastructure Level**: AWS CloudWatch alarms
- **Business Level**: Synthetic transaction monitoring

### Alert Classification

- **CRITICAL**: Immediate response required (< 5 minutes)
- **HIGH**: Response within 15 minutes
- **MEDIUM**: Response within 1 hour
- **LOW**: Response within 4 hours

## 3. Incident Response Procedures

### Phase 1: Detection & Assessment (0-5 minutes)

#### Automated Monitoring

```bash
# Check service health across regions
curl -f https://api.meqenet.et/health
curl -f https://api-dr.meqenet.et/health

# Database connectivity check
psql "postgresql://meqenet:***@db-primary.eu-west-1.rds.amazonaws.com/meqenetdb" -c "SELECT 1;"

# Redis connectivity check
redis-cli -h redis-primary.eu-west-1.cache.amazonaws.com ping
```

#### Manual Assessment

1. **Check AWS Console**: CloudWatch dashboards
2. **Verify Alert Sources**: PagerDuty, Slack, Email
3. **Assess Impact**: User-facing vs internal services
4. **Determine Severity**: Based on affected user count and business impact

### Phase 2: Containment (5-15 minutes)

#### Network Isolation

```bash
# Isolate affected region (if needed)
aws ec2 create-network-acl-entry \
  --network-acl-id acl-12345678 \
  --rule-number 100 \
  --protocol -1 \
  --rule-action deny \
  --cidr-block 0.0.0.0/0
```

#### Service Decommissioning

```bash
# Scale down services in affected region
kubectl scale deployment auth-service --replicas=0 -n meqenet
kubectl scale deployment api-gateway --replicas=0 -n meqenet
```

### Phase 3: Recovery (15-60 minutes)

#### Automated Failover

```bash
# Trigger automated failover
aws lambda invoke \
  --function-name meqenet-dr-failover \
  --payload '{"action": "failover", "targetRegion": "eu-central-1"}' \
  output.json
```

#### Database Failover

```bash
# Promote read replica to primary
aws rds failover-db-cluster \
  --db-cluster-identifier meqenet-db-cluster \
  --target-db-instance-identifier meqenet-db-eu-central-1
```

#### DNS Update

```bash
# Update Route 53 to point to secondary region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://dns-failover.json
```

### Phase 4: Verification (60-120 minutes)

#### Health Verification

```bash
# Verify all services are healthy
for service in auth-service api-gateway payment-service; do
  kubectl get pods -l app=$service -n meqenet
  kubectl logs -l app=$service -n meqenet --tail=50
done
```

#### Data Consistency Check

```bash
# Verify database consistency
psql "postgresql://meqenet:***@db-primary.eu-central-1.rds.amazonaws.com/meqenetdb" \
  -c "SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '1 hour';"
```

#### Transaction Verification

```bash
# Check for any stuck transactions
psql "postgresql://meqenet:***@db-primary.eu-central-1.rds.amazonaws.com/meqenetdb" \
  -c "SELECT * FROM outbox_messages WHERE status = 'PENDING' LIMIT 10;"
```

### Phase 5: Communication (Ongoing)

#### Internal Communication

- **Slack Channel**: #incident-response
- **Status Page**: Internal status page updates
- **Runbook Updates**: Document lessons learned

#### External Communication

- **Customer Communication**: Via app notifications and email
- **Partner Updates**: Payment processors, merchants
- **Regulatory Reporting**: NBE notification requirements

## 4. Service-Specific Recovery Procedures

### API Gateway Recovery

```bash
# Scale up in secondary region
kubectl scale deployment api-gateway --replicas=10 -n meqenet

# Update ingress configuration
kubectl apply -f k8s/ingress-dr.yaml

# Verify routing
curl -H "Host: api.meqenet.et" https://api-dr.meqenet.et/health
```

### Auth Service Recovery

```bash
# Scale up auth service
kubectl scale deployment auth-service --replicas=5 -n meqenet

# Verify JWT key synchronization
kubectl exec -it auth-service-pod -n meqenet -- cat /app/jwt-key-version

# Test authentication flow
curl -X POST https://api-dr.meqenet.et/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@meqenet.et","password":"test123"}'
```

### Database Recovery

```bash
# Check replication lag
aws rds describe-db-clusters \
  --db-cluster-identifier meqenet-db-cluster \
  --query 'DBClusters[0].DBClusterMembers'

# Force failover if needed
aws rds failover-db-cluster \
  --db-cluster-identifier meqenet-db-cluster

# Verify data consistency
psql "postgresql://meqenet:***@db-primary.eu-central-1.rds.amazonaws.com/meqenetdb" \
  -c "SELECT max(created_at) FROM audit_logs;"
```

### Redis Cache Recovery

```bash
# Verify Redis cluster status
redis-cli -h redis-cluster.eu-central-1.cache.amazonaws.com cluster nodes

# Warm up cache with critical data
kubectl exec -it cache-warmer-pod -n meqenet -- ./warm-cache.sh

# Verify cache hit rates
redis-cli -h redis-cluster.eu-central-1.cache.amazonaws.com info stats
```

## 5. Testing Procedures

### Quarterly DR Testing

```bash
# Simulate region failure
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Monitor failover time
time ./scripts/dr-test.sh

# Verify RTO/RPO compliance
./scripts/verify-rto-rpo.sh
```

### Monthly Component Testing

```bash
# Test individual service failover
./scripts/test-service-failover.sh auth-service

# Database failover testing
./scripts/test-db-failover.sh

# Network isolation testing
./scripts/test-network-isolation.sh
```

## 6. Regulatory Compliance

### NBE Requirements

- **Notification**: Report incidents within 24 hours
- **Documentation**: Maintain incident logs for 7 years
- **Testing**: Quarterly DR testing with documentation
- **Business Continuity**: 99.9% uptime SLA

### Data Protection

- **Encryption**: All data encrypted in transit and at rest
- **Backup**: Cross-region backup with 30-day retention
- **Access Control**: Multi-factor authentication required
- **Audit Trail**: All DR activities logged and auditable

## 7. Contact Information

### Incident Response Team

- **Primary On-Call**: +251-911-123-456
- **Secondary On-Call**: +251-911-654-321
- **DevOps Lead**: devops@meqenet.et
- **Security Officer**: security@meqenet.et

### External Contacts

- **AWS Support**: Enterprise support case
- **NBE Regulator**: compliance@nbe.gov.et
- **Payment Processors**: 24/7 support lines
- **Infrastructure Vendor**: Critical incident line

## 8. Lessons Learned & Improvements

### Post-Incident Review Process

1. **Timeline Reconstruction**: Document all events and responses
2. **Root Cause Analysis**: Identify contributing factors
3. **Impact Assessment**: Quantify business and technical impact
4. **Improvement Actions**: Implement preventive measures

### Continuous Improvement

- **Runbook Updates**: Incorporate lessons learned
- **Training**: Regular DR training for all team members
- **Technology Updates**: Implement new monitoring and automation
- **Process Optimization**: Streamline incident response procedures

---

**Document Control:**

- **Approved By**: CTO, Chief Risk Officer
- **Next Review**: April 2024
- **Version History**: See Git history for complete change log
