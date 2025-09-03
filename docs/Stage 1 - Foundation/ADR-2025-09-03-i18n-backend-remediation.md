# ADR: Remove Deprecated i18n FS Backend and Enforce Secure i18n Policy (2025-09-03)

## Status

Accepted

## Context

- CI/CD security audit failed due to a high-severity advisory transitively pulled via
  `i18next-node-fs-backend -> json5@2.0.0` (GHSA-9c47-m6qq-7p4h).
- The backend service `@meqenet/auth-service` uses `nestjs-i18n` with a file loader configured via
  `loaderOptions` and does not require `i18next-node-fs-backend`.
- FinTech enterprise standards require eliminating vulnerable dependencies at the source, not only
  pinning sub-dependencies.

## Decision

- Remove `i18next-node-fs-backend` from `@meqenet/auth-service` to eliminate the vulnerable chain.
- Retain a workspace-level `pnpm` override for `json5 >= 2.2.3` as a defense-in-depth safeguard.
- Codify a policy disallowing deprecated i18n backends in backend services.

## Policy: Secure i18n Backends

- Deprecated or unmaintained i18n backends (e.g., `i18next-node-fs-backend`) are not permitted.
- Prefer built-in loaders supported by `nestjs-i18n` (filesystem loader via `loaderOptions`) or
  maintained alternatives such as `i18next-fs-backend` when required, and only with current,
  non-vulnerable versions.
- All i18n packages must pass CI security gates (audit-ci) and be included in SBOM reviews.

## Alternatives Considered

- Pin transitive `json5` version via pnpm overrides only: mitigates CVE temporarily but retains
  risky dependency. Rejected as insufficient for enterprise-grade remediation.
- Replace with `i18next-fs-backend`: viable, but not necessary since `nestjs-i18n` file loader
  suffices and reduces attack surface.

## Consequences

- Reduced supply-chain risk by removing a deprecated backend.
- Minimal runtime impact since `nestjs-i18n` already reads translations from `src/app/i18n`.

## Rollout & Validation

- Completed: dependency removal, reinstall, `@meqenet/auth-service` build, audit-ci passed with zero
  high/critical.
- Ongoing: periodic dependency posture review (see Governance task).

## Ownership & Persona

- Primary: Data Security Specialist
- Supporting: FinTech DevOps Engineer, Senior Backend Developer

## References

- Advisory: GHSA-9c47-m6qq-7p4h
- Code: `backend/services/auth-service/src/app/app.module.ts` (i18n loader)
- Tasks: `tasks/tasks.yaml` governance tracking for transitive dependency reviews
