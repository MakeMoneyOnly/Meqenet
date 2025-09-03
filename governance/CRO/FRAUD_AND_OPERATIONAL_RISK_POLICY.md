# Meqenet Fraud and Operational Risk Policy

**Version:** 1.0 **Status:** Active **Last Updated:** 2025-06-27

---

## 1. Purpose

This policy establishes the framework for identifying, monitoring, and mitigating fraud and
operational risks across the Meqenet platform. The objective is to protect the company and its users
from fraudulent activity and ensure the stability and reliability of our services.

---

## 2. Fraud Risk Management

### 2.1. Fraud Monitoring

- **Automated Detection:** The platform will employ automated systems to monitor user onboarding and
  transaction activity for patterns indicative of fraud (e.g., synthetic identities, account
  takeovers, collusion).
- **Onboarding Verification:** The KYC (Know Your Customer) process, reliant on the Fayda National
  ID system, is the primary defense against fraudulent applications.
- **Transaction Rules:** A rules engine will flag or block transactions that are high-risk based on
  factors like velocity, amount, and user history.

### 2.2. Key Fraud Risk Indicators (KRIs)

The CRO dashboard will monitor the following KRIs:

| KRI                             | Green (Healthy)  | Amber (Monitor) | Red (Action Required) |
| :------------------------------ | :--------------- | :-------------- | :-------------------- |
| **Fraudulent Application Rate** | < 0.5%           | 0.5% - 1.0%     | > 1.0%                |
| **Transaction Fraud Rate**      | < 0.1% of volume | 0.1% - 0.2%     | > 0.2%                |
| **Chargeback Rate**             | < 0.2% of txns   | 0.2% - 0.4%     | > 0.4%                |

---

## 3. Operational Risk Management

### 3.1. Core Principles

- **System Stability:** Ensuring high availability and low latency for all critical services is
  paramount.
- **Payment Integrity:** The success rate of payment processing (both collections and disbursements)
  is a critical measure of operational health.
- **Compliance Adherence:** All operational processes must adhere to NBE regulations.

### 3.2. Key Operational Risk Indicators (KRIs)

| KRI                              | Green (Healthy) | Amber (Monitor) | Red (Action Required) |
| :------------------------------- | :-------------- | :-------------- | :-------------------- |
| **KYC Onboarding Success Rate**  | > 95%           | 90% - 95%       | < 90%                 |
| **Payment Gateway Success Rate** | > 98%           | 95% - 98%       | < 95%                 |
| **Critical System Uptime**       | > 99.9%         | 99.5% - 99.9%   | < 99.5%               |

---

## 4. Roles & Responsibilities

- **Chief Risk Officer (CRO):** Owns this policy and the overall fraud and operational risk
  framework.
- **Operations Team:** Manages the day-to-day fraud review and payment processing operations.
- **Engineering Team:** Responsible for maintaining system uptime and the stability of the platform.
- **Virtual CRO (Dashboard):** The primary tool for continuous monitoring of these KRIs.
