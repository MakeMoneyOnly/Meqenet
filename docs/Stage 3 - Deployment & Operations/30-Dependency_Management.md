# Dependency Management Plan (Meqenet BNPL Platform)

## 1. Scope

This document outlines the strategy for managing third-party dependencies across all microservices
and frontend applications within the Meqenet ecosystem.

## 2. Principles

1.  **Service-Level Independence**: Each microservice manages its own dependencies. The versions and
    libraries used in one service should not directly affect another.
2.  **Security First**: All dependencies must be scanned for vulnerabilities before being approved
    for use. Critical vulnerabilities must be addressed before deployment.
3.  **Centralized Auditing**: The DevOps team will maintain a central dashboard (e.g., using Snyk or
    Dependabot) to continuously monitor all dependencies across all services for known
    vulnerabilities.
4.  **Clear Governance for Open-Source Adoption**:
    - **Vetting Process**: Before a new open-source library is introduced, its author, maintenance
      history, and community support must be vetted.
    - **Approved List**: A list of pre-approved libraries and versions will be maintained.
    - **Exception Handling**: A formal process will be established for requesting and approving the
      use of libraries not on the approved list, requiring a clear business justification and risk
      assessment.
5.  **Automated Updates**: Dependabot or a similar tool will be configured to automatically create
    pull requests for patch and minor version updates of approved dependencies.
6.  **SBOM Generation**: A Software Bill of Materials (SBOM) will be generated for every build
    artifact to ensure a complete inventory of all software components.
7.  **License Compliance**: All dependencies must have permissive licenses (e.g., MIT, Apache 2.0,
    BSD) that are compatible with our commercial product. GPL or AGPL-licensed libraries are
    generally prohibited unless explicitly approved.
8.  **Exact Versioning**: All `package.json` or equivalent files must use exact version pinning
    (e.g., `"react": "18.2.0"`, not `"^18.2.0"`) to ensure reproducible builds across all
    environments.

## 3. Update Schedule

- **Patches (e.g., 1.0.x)**: Applied automatically via CI/CD upon release, provided they pass all
  automated tests.
- **Minor Versions (e.g., 1.x.0)**: Reviewed and applied within two weeks of release.
- **Major Versions (e.g., x.0.0)**: Require a formal risk assessment and migration plan. They are
  not applied automatically.

## 4. Process for Dependency Updates

1.  **Notification**: The automated dependency tool (e.g., Dependabot) creates a pull request.
2.  **Automated Testing**: The CI pipeline runs all unit, integration, and contract tests against
    the updated dependency.

## Critical Dependency Review - Examples by Service Context

The following are examples of dependency types that require extra scrutiny within their respective
service domains.

### Core Frameworks (All Services)

- **Node.js/NestJS**: The foundation of most of our backend services.
- **gRPC/Protocol Buffers**: For all inter-service communication.

### Security & Authentication (`auth-service`)

- **Authentication Libraries (e.g., Passport.js)**: Critical for user authentication.
- **Cryptography Libraries (e.g., bcrypt)**: For password hashing.
- **JWT Libraries**: For creating and verifying access tokens.

### Payments (`payments-service`)

- **Payment Gateway SDKs**: For integrating with Ethiopian providers like Telebirr.
- **Decimal/Money Libraries**: For handling ETB transactions accurately without floating-point
  errors.

### Data & Storage (Multiple Services)

- **Database Drivers (e.g., `pg`)**: For connecting to PostgreSQL.
- **ORM/Query Builders (e.g., TypeORM, Kysely)**: For interacting with service-specific databases.

### AI & Analytics (`analytics-service`, `fraud-service`)

- **ML/AI Libraries (e.g., TensorFlow.js, scikit-learn)**: For our recommendation and fraud
  detection models.
- **Data Processing Libraries**: For running analytics jobs.

## Emergency Update Protocol

For critical security vulnerabilities:

1. Security team notifies development team immediately
2. Evaluate exploit risk and potential impact
3. Implement temporary mitigations if needed
4. Schedule emergency update outside regular cycle
5. Deploy fix with abbreviated testing if threat is imminent
6. Document incident and response for compliance records

## Dependency Approval Process

New dependencies must be:

- Actively maintained (updates within last 6 months)
- Well-documented with clear API
- Under appropriate license (MIT, Apache 2.0, etc.)
- Scanned for vulnerabilities before approval
- Approved by both technical lead and security specialist

## Tools

- **npm audit**: Primary vulnerability scanning tool
- **npm outdated / npm-check-updates**: For identifying update candidates
- **eslint-plugin-security**: Static analysis for security issues
- **GitHub Security Advisories**: Monitor alerts for dependencies
- **Package Phobia**: Evaluate dependency size impact
- **Snyk**: For continuous vulnerability monitoring and license compliance checks
- **Husky**: Git hooks for pre-commit and pre-push security checks

## Compliance Documentation

All dependency updates affecting security controls must be documented for NBE compliance and
internal audit purposes.

## Related Documentation

- [Security Architecture](../Stage%201%20-%20Foundation/07-Security.md)
- [Deployment Strategy](./23-Deployment.md)
- [Monitoring & Logging](./25-Monitoring_And_Logging.md)
