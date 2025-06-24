# 26. Incident Response Plan

## 1. Overview

This document outlines the procedure for responding to unplanned service interruptions or security
incidents within our microservice architecture. The goal is to restore service safely and quickly
while collecting necessary information for post-mortems and minimizing impact on other services.

## 2. Guiding Principles

- **Isolate and Contain**: The primary goal is to quickly identify the failing service and prevent
  cascading failures.
- **Communicate Clearly**: Provide timely and accurate updates to internal stakeholders and, if
  necessary, external users.
- **Learn and Improve**: Every incident is an opportunity to improve the resilience of our system.
  Blameless post-mortems are mandatory.

## 3. Incident Severity Levels (SEV)

| Level     | Definition                                                                                                                                                | Examples                                                                                                                                                      | Response                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **SEV 1** | **Critical Impact**: System-wide outage, core financial transaction failure (e.g., payments), data loss, or major security breach.                        | - Payment processing is down.<br>- API Gateway is returning 5xx errors for >50% of traffic.<br>- Confirmed data breach.                                       | **Immediate 24/7 Response**. All hands on deck. PagerDuty alert to on-call rotation.                        |
| **SEV 2** | **Significant Impact**: A major non-critical service is down (e.g., marketplace search), or a core service is severely degraded. Significant user impact. | - User login/registration is failing.<br>- A single microservice is down, causing errors in one part of the app.<br>- High latency across multiple services.  | **Immediate Response within business hours, best-effort after hours**. PagerDuty alert to on-call rotation. |
| **SEV 3** | **Minor Impact**: A non-critical feature is failing or a service is experiencing intermittent issues. Minimal user impact.                                | - A background job is failing but has a retry mechanism.<br>- Increased error rate in a single, non-critical service.<br>- A third-party integration is slow. | **Response during business hours**. Slack notification to the owning team's channel.                        |

## 4. Roles and Responsibilities

- **Incident Commander (IC)**: The single point of authority during an incident. Manages the
  response, coordinates teams, and makes key decisions. This role is rotated among senior engineers.
- **Communications Lead (CL)**: Manages all internal and external communication. Provides regular
  updates on the incident status.
- **Technical Lead (TL)**: The subject matter expert for the service(s) involved. Leads the
  technical investigation and implements the fix.
- **Scribe**: Documents a timeline of events, key decisions, and actions taken during the incident.

## 5. Incident Response Workflow

1.  **Detection**: An incident is declared via an automated alert (Prometheus/AlertManager) or
    manually by an engineer in the `#incidents` Slack channel.
2.  **Triage & Declaration**: The on-call engineer assesses the alert, determines the SEV level, and
    formally declares an incident. An Incident Commander is assigned.
3.  **Mobilization**: A dedicated Slack channel is created (e.g.,
    `#incident-2023-10-27-api-outage`). The IC assembles the required team (TLs for affected
    services, CL). A video call "war room" is started.
4.  **Investigation**: The team works to identify the root cause. **Key tools**:
    - **Distributed Tracing (Datadog/Sentry)**: Use the `Correlation-ID` to trace the failing
      requests across services.
    - **Service Dashboards (Grafana)**: Check the metrics (latency, error rate, saturation) for
      individual services.
    - **Logs (CloudWatch/Datadog)**: Query logs using the `Correlation-ID`.
5.  **Mitigation**: Implement a short-term fix to restore service. Examples:
    - Roll back the last deployment for the failing service.
    - Manually scale up a service.
    - Enable a circuit breaker to isolate the failing service.
    - Failover to a different AWS region/AZ.
6.  **Resolution**: The IC declares the incident resolved once the user-facing impact is gone. The
    fix is confirmed to be stable.
7.  **Post-Mortem**: A blameless post-mortem is scheduled within 48 hours. The goal is to understand
    the root cause and create action items to prevent recurrence. The output is a written document
    shared with the entire engineering team.

## 6. Communication Protocol

- **Internal**: The `#incidents` channel is the single source of truth. The CL provides updates
  every 15 minutes for a SEV-1, and every 30-60 minutes for a SEV-2.
- **External**: For user-impacting incidents, updates will be posted to our public status page. All
  external communication must be approved by the IC and company leadership.
