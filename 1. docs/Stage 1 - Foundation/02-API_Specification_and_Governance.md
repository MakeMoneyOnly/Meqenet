# 02. API Specification and Governance

## 1. Purpose and Scope

This document defines the official standards and governance policies for all Application Programming
Interfaces (APIs) and service communication protocols within the Meqenet 2.0 ecosystem. Its purpose
is to ensure all interfaces—both external (client-to-server) and internal (service-to-service)—are
designed, documented, and managed in a consistent, secure, and sustainable manner.

This governance framework covers two primary traffic patterns:

- **North-South Traffic**: Communication between external clients (mobile app, web app, third-party
  integrators) and our backend.
- **East-West Traffic**: Internal communication between our backend microservices.

## 2. North-South Communication (External APIs)

This section governs all APIs exposed to the public internet or external clients.

### 2.1 The Official Standard: OpenAPI 3.0

**All external RESTful APIs MUST be defined using the OpenAPI 3.0 specification.**

- **Single Source of Truth**: The OpenAPI specification (`openapi.yaml` file) is the undisputed,
  canonical source of truth for its corresponding API. If it's not in the spec, it doesn't exist.
- **Spec-First Development**: Teams should practice "spec-first" design. The API contract is
  designed and reviewed in the `openapi.yaml` file _before_ implementation begins.
- **Location**: The `openapi.yaml` file MUST be located in the root of the service's source code
  that exposes it.

### 2.2 API Documentation

**API documentation MUST be automatically generated from the `openapi.yaml` specification.** Manual
documentation is prohibited to prevent documentation drift.

- **Tooling**: A standardized tool (e.g., Redoc, Swagger UI) will be integrated into the CI/CD
  pipeline.
- **Developer Portal**: The generated documentation will be automatically published to a central
  developer portal.

### 2.3 API Versioning Strategy

APIs MUST use URI-based versioning to ensure backward compatibility is never broken. The version
will be prefixed in the URL path.

- **Format**: `/v[major-version-number]` (e.g., `v1`, `v2`)
- **Example**: `https://api.meqenet.com/v1/payments`

- **Major Version (v1, v2)**: Incremented for any breaking change (e.g., removing a field, changing
  a data type, altering an endpoint path). A new major version is deployed as a separate API.
- **Minor/Patch Versions**: For non-breaking changes (e.g., adding a new endpoint, adding an
  optional field), no version change is required.

### 2.4 API Lifecycle Governance

All external APIs and their endpoints follow a defined lifecycle.

1.  **Design**: The API is designed and reviewed via the `openapi.yaml` spec.
2.  **Active**: The API version is live and fully supported.
3.  **Deprecated**: An endpoint or entire API version is marked for future removal.
    - It MUST continue to function but will return a
      `Warning: 299 - "Endpoint is deprecated and will be removed on YYYY-MM-DD"` header in the
      response.
    - Deprecation MUST be announced to all consuming teams with a clear timeline.
4.  **Retired (Decommissioned)**: The endpoint is removed and will return a `410 Gone` status code.
    An API version cannot be retired until all its consumers have migrated to a newer version.

## 3. East-West Communication (Internal Service-to-Service)

This section governs all communication between microservices within our internal network. The
primary goal is performance, reliability, and type safety.

### 3.1 Synchronous Communication: gRPC

For high-performance, synchronous request/response communication between services, **gRPC is the
preferred protocol.**

- **Protocol Buffers as the Contract**: The service's contract MUST be defined in a `.proto` file.
  This file is the single source of truth for the service's interface, defining its methods,
  requests, and response messages.
- **Shared Repository**: All `.proto` files will be stored in a centralized Git repository to
  facilitate sharing and generation of client stubs across different services and languages.
- **Versioning**: gRPC services should follow a package-based versioning scheme (e.g.,
  `package meqenet.payments.v1;`). Breaking changes require creating a new package version.

### 3.2 Asynchronous Communication: Event Bus

For non-blocking operations, notifications, and decoupling services, communication **MUST occur
asynchronously via a centralized event bus** (e.g., AWS SNS/SQS).

- **Event Schema as the Contract**: Each event MUST have a clearly defined, versioned schema. These
  schemas will be stored in a shared schema registry.
- **Idempotency**: All event consumers MUST be designed to be idempotent, meaning they can safely
  process the same message multiple times without unintended side effects.
- **Fan-out Pattern**: Use a "fan-out" pattern where a service publishes a single event to a topic,
  and multiple consumer services can subscribe to that topic independently.

## 4. Security and Authentication

All API endpoints and service-to-service communication channels MUST be secured according to the
policies defined in `07-Security.md`.

- **External APIs (North-South)**: The `security` and `securitySchemes` objects within the
  `openapi.yaml` specification must accurately reflect the authentication method (e.g., JWT Bearer
  Token). Unsecured public endpoints are prohibited without a formal exception.
- **Internal Communication (East-West)**: All service-to-service communication MUST be encrypted
  using mutual TLS (mTLS) to ensure that only trusted services can communicate with each other.
