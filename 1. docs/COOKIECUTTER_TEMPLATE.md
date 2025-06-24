# Microservice Template (`cookiecutter`)

## 1. Overview

This document defines the structure and contents of the Meqenet `cookiecutter` template for creating
new Node.js microservices. The purpose of this template is to ensure that every new service adheres
to our architectural, security, and operational standards from its inception. It is the "gold
standard" for all backend development.

Using this template is **mandatory** for creating any new microservice.

## 2. Philosophy

- **Secure by Default:** Services are generated with production-grade security features
  pre-configured.
- **Operationally Ready:** Includes built-in health checks, structured logging, and configuration
  management.
- **Consistency:** Provides a uniform project structure and development experience across all
  microservices, simplifying maintenance and developer onboarding.
- **Compliance-Ready:** Foundational elements required for NBE compliance and financial-grade
  auditing are included.

## 3. How to Use

To create a new service, run the `create-service` script from the monorepo root:

```bash
./scripts/create-service.sh
```

You will be prompted for the service name (e.g., `payments-service`), and the script will generate
the new service directory with all the required files.

## 4. Template Contents: The Gold Standard

Every service generated from the `cookiecutter` template **must** include the following components:

### 4.1. Secure Multi-Stage `Dockerfile`

- A production-optimized `Dockerfile` that uses multi-stage builds.
- **Stage 1 (`builder`):** Compiles the TypeScript code into JavaScript.
- **Stage 2 (`production`):** Copies only the compiled code and production dependencies into a
  minimal, hardened Node.js base image.
- Runs as a non-root user for enhanced security.
- Includes health check instructions.

### 4.2. API Contract Placeholder

- Each service must have a well-defined API contract. The template includes a placeholder for this:
  - For **REST APIs** (North-South traffic): A placeholder `openapi.yaml` file.
  - For **gRPC APIs** (East-West traffic): A placeholder `.proto` file.
- This enforces a "spec-first" development approach.

### 4.3. Pre-configured Security

- **Security Middleware:** The `main.ts` file comes pre-configured with essential security
  middleware, including `helmet` for protection against common web vulnerabilities.
- **CORS:** Configured with restrictive defaults, ready for production environments.
- **Input Validation:** Global pipes are set up to enforce validation on all incoming DTOs.

### 4.4. Health Check Endpoint

- A mandatory, unauthenticated health check endpoint is included at `/healthz`.
- This endpoint is used by Kubernetes or other orchestrators to verify the service's liveness and
  readiness, enabling automated recovery.

### 4.5. Enhanced Logging and Error Handling

- **Logging Interceptor:** The secure, context-aware logging interceptor is included to ensure all
  requests are logged with a correlation ID.
- **Global Exception Filter:** The global exception filter is included to catch all unhandled
  exceptions and format them into a standardized, secure error response, preventing stack traces
  from being exposed. -g

### 4.6. Configuration Module (Ready for Secrets Manager)

- A dedicated `ConfigModule` is included, pre-wired to read all configuration from **environment
  variables**.
- This design is intentional and aligns with the 12-Factor App methodology. It allows seamless
  integration with AWS Secrets Manager (or other secret stores) in our production environments by
  injecting secrets as environment variables into the container.
- **No default or hardcoded secrets are present in the template.**

### 4.7. Comprehensive `README.md`

- A detailed `README.md` placeholder is generated for each new service. It includes the following
  mandatory sections:
  - **Service Purpose:** A clear description of the service's business capability and its bounded
    context.
  - **API Contract:** A link to the `openapi.yaml` or `.proto` file and instructions on how to
    regenerate clients.
  - **Dependencies:** A list of other services it depends on.
  - **How to Run Locally:** Clear, concise instructions on how to run the service in a local
    development environment, consistent with the `LOCAL_DEVELOPMENT.md` guide.
  - **Key Environment Variables:** A list of required environment variables for the service to
    function.

### 4.8. Sample `jest.config.ts` and Test Setup

- The template includes a standard Jest configuration and sample folders for `unit` and
  `integration` tests, encouraging developers to write tests from day one.

## 5. Governance

The `cookiecutter` template is a living document, managed by the **Financial Software Architect**.
Any proposed changes must be submitted via a pull request and undergo a rigorous review to ensure
they meet our standards for security, scalability, and operational excellence.
