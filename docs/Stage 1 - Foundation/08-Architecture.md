# System Architecture

## Overview

This document outlines the high-level architecture of the Meqenet.et BNPL mobile application. Its
purpose is to provide a comprehensive view of how various components interact and the rationale
behind key design decisions. The architecture is designed to support a complete financial ecosystem,
including payment processing, a merchant marketplace, cashback rewards, and advanced user experience
features.

**Microservice Architecture** is the foundational architectural style for our backend systems,
chosen for its flexibility, scalability, and resilience, which are critical in the dynamic FinTech
landscape. On the frontend, we implement a **Feature-Sliced Architecture (FSA)**, which aligns with
the principles of modularity and separation of concerns. This dual approach ensures proper security
boundaries and maintainable code organization across the entire ecosystem.

For comprehensive details on our payment options and business model, see
[Business Model](./7.%20Business_Model.md).

> **Related Documentation:**
>
> - [Architecture Governance](./01-Architecture_Governance.md): Governance rules for our
>   microservices.
> - [Tech Stack](./09-Tech_Stack.md): Detailed technology choices.
> - [Database Strategy](./10-Database.md): Principles for decentralized data management.
> - [Security](./07-Security.md): Security architecture and practices.

## 1. Architectural Goals & Principles

The architecture is designed to deliver a secure, reliable, and comprehensive BNPL financial
ecosystem by adhering to the following core principles:

- **Security & Compliance:** Security is at the core of our design. We follow financial industry
  standards and regulatory requirements, applying defense-in-depth, least privilege, and secure
  defaults.
- **Scalability & Performance:** Our microservice architecture allows us to scale individual
  services independently based on demand, ensuring the system can handle high transaction volumes
  without degradation.
- **Reliability & Resilience:** The decoupled nature of microservices enhances fault isolation. We
  aim for high availability (99.9%+) through redundancy, health checks, and graceful degradation.
- **Modularity & Extensibility:** Both microservices and FSA are built on modularity. This allows us
  to easily add new payment methods, partners, and financial products via well-defined interfaces.
- **Agility & Adaptability:** The FinTech market evolves rapidly. Our architecture allows us to
  develop, deploy, and modify services independently, accelerating our time-to-market and ability to
  adapt.
- **Data Integrity:** Each microservice is the single source of truth for its data domain, ensuring
  consistency and accuracy of financial records through transactional operations and audit trails.

## System Architecture Diagram

_(Placeholder: Replace ASCII with a link to a detailed visual diagram showing specific interactions
between microservices, data flows, and technologies used for communication, e.g., REST, Kafka, gRPC.
The diagram should illustrate services like Rewards Engine, Marketplace Service, Analytics Platform,
and their databases.)_

## 2. Architectural Approach: Microservices and Feature-Sliced Design

Meqenet.et's architecture is built on two complementary patterns: **Microservice Architecture** for
the backend and **Feature-Sliced Architecture (FSA)** for organizing our frontend and backend
codebases.

### 2.1 Why Microservices?

We have chosen a microservice architecture for its strategic advantages in the fast-moving world of
FinTech:

- **Flexibility and Agility:** Our application is a collection of loosely coupled services. This
  allows development teams to build, test, and deploy features independently and respond quickly to
  market changes.
- **Scalability:** We can scale individual services (e.g., the `Payment & Transaction Service`)
  independently, optimizing resource usage and ensuring performance under varying loads.
- **Technology Heterogeneity:** Each microservice can use the technology best suited for its task,
  particularly for our complex database needs where a one-size-fits-all approach would fail.
- **Improved Fault Isolation:** If one service fails, the others can continue to function,
  minimizing user impact. This resilience is critical for a financial application.

### 2.2 Feature-Sliced Architecture (FSA)

FSA complements our microservice backend by structuring the codebase into modular, self-contained
"slices," each representing a distinct business feature. This provides superior security boundaries
and maintainability. _(Note: The detailed FSA structure (layers, internal structure, etc.) remains
as previously defined but is omitted here for brevity in this specific edit.)_

## 3. Key Architectural Components

### 3.1 Backend Microservices

Our server-side logic is decomposed into a suite of independent, fine-grained microservices. Each
service communicates via APIs, owns its own database, and can be deployed and scaled independently.

- **API Gateway & Service Mesh:** A single entry point that handles authentication, authorization,
  rate limiting, and intelligent request routing to the appropriate downstream microservice.
- **User & Identity Service:** Manages user profiles, authentication, KYC verification, and credit
  scoring.
- **Payment & Transaction Service:** Processes all payment plans, installments, and settlements.
- **Rewards & Cashback Engine:** Manages the loyalty program, calculates cashback, and processes
  redemptions.
- **Merchant & Marketplace Service:** Handles merchant onboarding, product catalogs, and marketplace
  operations.
- **Analytics & Intelligence Platform:** Aggregates data for real-time monitoring, fraud detection,
  and business intelligence.
- **Notification Hub:** Delivers multi-channel notifications (SMS, push, email) to users.

### 3.2 Client-Side Applications

- **React Native Mobile App:** The primary, cross-platform application for iOS and Android.
- **Merchant Dashboard:** A web-based portal for merchants to manage sales, products, and
  settlements.
- **Progressive Web App (PWA):** Provides core functionality for users on the web.

### 3.4 Data Services & Storage

- **Database-per-Service**: Each microservice has its own dedicated PostgreSQL database, ensuring
  loose coupling and data isolation.
- **Decentralized Data Management**: Service teams have full ownership of their data schema and are
  responsible for its evolution and maintenance.
- **API-Only Access**: Direct database access between services is strictly prohibited. All data
  exchange must occur through versioned, backward-compatible service APIs.

### 3.5 Service Discovery

Our architecture uses Kubernetes' built-in DNS-based service discovery. When a service is deployed,
Kubernetes automatically creates a stable DNS entry (e.g.,
`payments-service.default.svc.cluster.local`). Other services within the cluster can then reliably
discover and communicate with it using this address, without needing to hardcode IP addresses or
ports. This provides a robust and automated service registry directly within our orchestration
platform.

### 3.6 Cross-Cutting Architectural Patterns

#### 3.6.1 Idempotency

To prevent data corruption and inconsistent state from duplicate requests (e.g., due to network
retries), all state-modifying endpoints (especially those in the `payments-service`) **MUST** be
idempotent. This is achieved by requiring clients to generate and send a unique `Idempotency-Key` in
the header of `POST`, `PUT`, and `PATCH` requests. The server will store the result of the first
successful request for a given key and return this cached response for any subsequent requests with
the same key.

#### 3.6.2 Caching

To ensure high performance and reduce load on backend services, a distributed caching layer (e.g.,
Redis) **MUST** be implemented. This cache will be used for:

- **Read-heavy flows:** Caching product catalog data, merchant details, and other frequently
  accessed, non-critical data in the `merchant-service` and `marketplace-service`.
- **Session Management:** Storing session data to reduce database load.
- **Rate Limiting:** Caching request counts for rate-limiting implementations in the API Gateway.

## 4. Cross-Cutting Concerns

These concerns are managed centrally but apply to all services within the ecosystem:

- **Observability:** We use a centralized stack (e.g., Prometheus, Grafana, Jaeger) for logging,
  monitoring, and tracing to ensure deep visibility into system health.
- **Security:** Comprehensive security is implemented at every layer. Refer to the
  [Security](./07-Security.md) document for details.
- **CI/CD Pipeline:** A fully automated CI/CD pipeline for each service allows for independent and
  rapid build, test, and deployment cycles.

## 5. Event-Driven Architecture Standards

While many interactions are synchronous via gRPC, asynchronous, event-based communication is
critical for decoupling services and ensuring resilience. All event-driven patterns **MUST** adhere
to the following standards.

### 5.1. Event Schema and Documentation

To ensure clarity and prevent integration issues, all asynchronous events **MUST** be formally
documented using the **AsyncAPI** specification. Each service that produces events must maintain an
`asyncapi.yaml` file, defining the channels it publishes to and the schema of its event payloads.
This specification serves as the discoverable, version-controlled contract for all events.

### 5.2. Reliable Event Publishing (Transactional Outbox)

To guarantee that critical business events are published reliably (at-least-once delivery) and to
avoid dual-writes, services that publish events (e.g., `payments-service`) **MUST** implement the
**Transactional Outbox Pattern**. This pattern involves atomically committing the database state
change and the event to be published in the same local transaction. A separate outbox processor
service will then read from the outbox table and reliably publish the events to the message broker
(e.g., RabbitMQ, Kafka).

### 5.3. Disaster Recovery (DR)

Our disaster recovery strategy is based on a multi-region, active-passive model. Production
infrastructure is replicated to a secondary AWS region. In the event of a primary region failure,
traffic will be failed over after a manual approval gate. RPO (Recovery Point Objective) is targeted
at < 1 hour, and RTO (Recovery Time Objective) is targeted at < 4 hours. This is documented in
detail in the [Security](./07-Security.md) document.

---

This comprehensive architecture supports Meqenet 2.0's evolution from a BNPL platform into
Ethiopia's leading financial super-app, with robust foundations for regulatory compliance, cultural
adaptation, and future innovation while maintaining the highest standards of security, performance,
and user experience.

**Architecture Version**: 2.0 (Enhanced)  
**Last Updated**: January 2025  
**Next Review**: February 2025
