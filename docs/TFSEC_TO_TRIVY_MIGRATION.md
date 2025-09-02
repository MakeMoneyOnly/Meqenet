# tfsec to Trivy Migration Guide

## Summary of Changes

### Issue Fixed

- **Problem**: GitHub Actions workflows were failing with error:
  `Unable to resolve action aquasecurity/tfsec-sarif-action@v1.0.5`
- **Root Cause**: Version `v1.0.5` doesn't exist. The latest version is `v0.1.4`
- **Additional Context**: tfsec has been integrated into Trivy, which is now the recommended tool

### Immediate Fix Applied

Updated the following workflows to use the correct version:

1. `.github/workflows/infrastructure.yml` - Changed from `v1.0.5` to `v0.1.4`
2. `.github/workflows/iac-security-scan.yml` - Changed from `v1.0.5` to `v0.1.4`

### Long-term Solution

Created new workflow using Trivy: `.github/workflows/trivy-iac-scan.yml`

## Why Migrate to Trivy?

1. **Active Development**: tfsec is now part of Trivy and no longer maintained separately
2. **Comprehensive Scanning**: Trivy provides unified scanning for:
   - Infrastructure as Code (includes all tfsec checks)
   - Container images
   - File systems
   - Git repositories
   - Kubernetes clusters
3. **Better Integration**: Single tool for all security scanning needs
4. **Continuous Updates**: Regular updates with new security checks

## Migration Steps

### Option 1: Quick Fix (Already Applied)

✅ Update tfsec-sarif-action version to `v0.1.4` in existing workflows

### Option 2: Full Migration to Trivy (Recommended)

1. **Add the new Trivy workflow**:
   - Already created: `.github/workflows/trivy-iac-scan.yml`
   - Includes all tfsec functionality plus additional security checks

2. **Test the new workflow**:

   ```bash
   # Trigger the workflow manually from GitHub Actions tab
   # Or push changes to infrastructure files
   ```

3. **Verify results**:
   - Check GitHub Security tab for SARIF results
   - Review PR comments for scan results

4. **Remove old workflows** (after testing):
   ```bash
   # Once Trivy is working, remove old tfsec configurations
   git rm .github/workflows/iac-security-scan.yml
   # Update infrastructure.yml to remove tfsec step
   ```

## Feature Comparison

| Feature                     | tfsec-sarif-action | Trivy              |
| --------------------------- | ------------------ | ------------------ |
| Terraform scanning          | ✅                 | ✅                 |
| CloudFormation              | ❌                 | ✅                 |
| Kubernetes manifests        | ❌                 | ✅                 |
| Dockerfile scanning         | ❌                 | ✅                 |
| SARIF output                | ✅                 | ✅                 |
| GitHub Security integration | ✅                 | ✅                 |
| PR comments                 | Manual setup       | ✅ (included)      |
| Active maintenance          | ❌                 | ✅                 |
| Custom policies             | Limited            | ✅ (Rego policies) |

## Testing the Fix

### For tfsec fix:

```bash
# Commit and push the changes
git add .github/workflows/infrastructure.yml .github/workflows/iac-security-scan.yml
git commit -m "fix: Update tfsec-sarif-action to valid version v0.1.4"
git push
```

### For Trivy migration:

```bash
# Test locally first
docker run --rm -v $(pwd):/src aquasec/trivy config /src

# Commit the new workflow
git add .github/workflows/trivy-iac-scan.yml
git commit -m "feat: Add Trivy IaC scanning workflow to replace tfsec"
git push
```

## Monitoring

After deployment:

1. Check GitHub Actions tab for successful workflow runs
2. Review Security tab for vulnerability reports
3. Monitor PR comments for scan results

## Support

- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Trivy GitHub Action](https://github.com/aquasecurity/trivy-action)
- [Migration from tfsec](https://github.com/aquasecurity/trivy/discussions/2907)

## Rollback Plan

If issues occur with Trivy:

1. The tfsec workflows are already fixed and can continue to be used
2. Version `v0.1.4` of tfsec-sarif-action is stable and working
3. Keep both workflows running in parallel during transition period
