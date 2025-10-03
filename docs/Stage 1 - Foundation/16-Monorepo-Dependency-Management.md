# Monorepo Dependency Management Standards

## Overview

This document establishes the standards and best practices for dependency management within the Meqenet monorepo. Following enterprise-grade fintech standards, we use unified package management to ensure consistency, security, and maintainability across all services.

## Core Principles

### 1. Unified Package Management

**Standard**: All services use pnpm workspace for dependency management.

- **✅ DO**: Use pnpm workspace with shared dependencies
- **❌ DON'T**: Create independent `package-lock.json` or `node_modules` per service

### 2. Workspace Structure

```
meqenet-platform/
├── pnpm-workspace.yaml          # Workspace configuration
├── package.json                 # Root dependencies & scripts
├── pnpm-lock.yaml              # Single lockfile for entire workspace
└── backend/services/*/         # All services share workspace dependencies
```

### 3. When Service Isolation IS Appropriate (Rare Cases)

Service-level dependency isolation should only be used when there's a **compelling technical requirement**:

#### Valid Reasons for Isolation:
- **Different Node.js Runtime Requirements**: Service requires different Node.js version
- **Legacy Migration**: Temporary isolation during major technology migration
- **Experimental Dependencies**: Prototyping with unstable packages
- **Third-party Conflicts**: Conflicting dependency requirements with external services

#### Process for Isolation Approval:
1. **Technical Justification**: Document why workspace sharing isn't viable
2. **Architecture Review**: Get approval from FinTech DevOps Engineer
3. **Temporary Measure**: Set timeline for migration back to workspace
4. **Security Review**: Ensure isolated service still meets security standards

## Implementation Standards

### Dependency Installation

```bash
# ✅ Correct: Always install from workspace root
pnpm install

# ❌ Incorrect: Never install in individual services
cd backend/services/api-gateway && npm install
```

### Build Process

```bash
# ✅ Correct: Workspace-aware recursive builds
pnpm run build

# ✅ Correct: Individual service builds (uses workspace deps)
pnpm --filter @meqenet/api-gateway build
```

### Adding Dependencies

```bash
# ✅ Correct: Add to workspace root for shared dependencies
pnpm add -D @nestjs/cli

# ✅ Correct: Add to specific service for service-specific deps
pnpm add -D @service-specific/package --filter @meqenet/api-gateway
```

## Enterprise FinTech Benefits

### 1. Security Consistency
- **Unified Security Scanning**: Single source of truth for vulnerability scanning
- **Consistent Patch Management**: All services updated simultaneously
- **Centralized Security Policies**: Workspace-level overrides for security fixes

### 2. Compliance & Audit
- **Regulatory Compliance**: Easier to maintain consistent security postures
- **Dependency Audit Trails**: Single lockfile for compliance reporting
- **Version Consistency**: Ensures all services use approved dependency versions

### 3. Operational Excellence
- **Simplified CI/CD**: Predictable builds across all services
- **Reduced Complexity**: No mixed package manager conflicts
- **Easier Maintenance**: Single point for dependency updates

## Recent Resolution: API Gateway Integration

### Problem Identified
The `api-gateway` service was configured with independent npm package management:
- Had its own `package-lock.json`
- Had its own `node_modules` directory
- Could not access `@nestjs/cli` from workspace

### Root Cause
- Historical setup inconsistency
- Mixed package manager usage
- Incomplete migration to pnpm workspace

### Solution Implemented
1. **Removed npm artifacts**: Deleted `package-lock.json` and `node_modules`
2. **Verified workspace config**: Confirmed `pnpm-workspace.yaml` includes all services
3. **Reinstalled dependencies**: `pnpm install` from workspace root
4. **Validated builds**: All backend services now build successfully

### Files Changed
- **Removed**: `backend/services/api-gateway/package-lock.json`
- **Removed**: `backend/services/api-gateway/node_modules/` (entire directory)
- **Verified**: `pnpm-workspace.yaml` configuration
- **Updated**: Workspace dependency resolution

## Best Practices Checklist

### For New Services
- [ ] **Workspace Integration**: Ensure service is included in `pnpm-workspace.yaml`
- [ ] **No Independent Lockfiles**: Never create `package-lock.json` or `yarn.lock`
- [ ] **Workspace Dependencies**: Use workspace-shared dependencies when possible
- [ ] **Documentation**: Update service README with workspace usage

### For Dependency Management
- [ ] **Security First**: All dependencies pass security scanning
- [ ] **Version Consistency**: Use compatible versions across services
- [ ] **Minimal Dependencies**: Avoid unnecessary packages
- [ ] **Regular Updates**: Keep dependencies current with security patches

### For CI/CD Integration
- [ ] **Workspace Builds**: Use `pnpm -r --if-present` for recursive builds
- [ ] **Dependency Caching**: Cache `.pnpm-store` and `node_modules`
- [ ] **Lockfile Integrity**: Ensure `pnpm-lock.yaml` is committed and up-to-date
- [ ] **Build Validation**: Test builds in isolated environments

## Troubleshooting

### Common Issues

#### 1. "Module not found" for CLI tools
```
Error: Cannot find module '@nestjs/cli'
```
**Solution**: Remove service-specific `node_modules` and `package-lock.json`, then run `pnpm install` from root.

#### 2. Version conflicts between services
**Solution**: Use workspace overrides in root `package.json`:
```json
"pnpm": {
  "overrides": {
    "package-name": "compatible-version"
  }
}
```

#### 3. Mixed package manager warnings
**Solution**: Ensure all services use pnpm workspace, remove npm/yarn lockfiles.

### Emergency Isolation (Last Resort)

If workspace integration is absolutely not possible:

1. Document technical justification
2. Get architecture review approval
3. Create isolated service with:
   - Dedicated `package.json`
   - Independent build process
   - Separate CI/CD pipeline
   - Regular migration timeline

## Standards Enforcement

### Automated Checks
- **Pre-commit hooks**: Validate workspace structure
- **CI/CD gates**: Fail builds with mixed package managers
- **Dependency scanning**: Unified security scanning

### Code Reviews
- **Architecture Review**: Required for any service isolation requests
- **Security Review**: Validate dependency security implications
- **DevOps Review**: Ensure CI/CD compatibility

## Future Considerations

### Potential Enhancements
- **Service-specific overrides**: Allow version overrides per service when necessary
- **Dependency groups**: Separate dev vs production dependencies more granularly
- **Build optimization**: Parallel builds with workspace awareness

### Migration Strategy
For existing projects with mixed package managers:
1. **Audit**: Identify all services with independent package management
2. **Prioritize**: Fix critical services first (those blocking CI/CD)
3. **Migrate**: Remove lockfiles and reintegrate into workspace
4. **Validate**: Ensure builds work and security scanning passes
5. **Document**: Update standards and prevent regression

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Responsible Team**: FinTech DevOps Engineering
**Review Cycle**: Quarterly

---

*This standard ensures Meqenet maintains enterprise-grade dependency management while supporting the complex requirements of a financial services platform.*
