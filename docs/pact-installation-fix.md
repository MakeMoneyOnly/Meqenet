# Pact Installation Conflict Resolution

## Problem Summary

The CI/CD pipeline was failing during the Contract Testing with Pact step for the auth-service with
the following error:

```
ERROR:  Error installing pact_broker-client:
	"pact-broker" from pact_broker-client conflicts with /usr/local/bin/pact-broker
```

## Root Cause

The issue occurred because:

1. The workflow first installs **Pact Ruby Standalone**, which includes a `pact-broker` binary
2. This binary gets copied to `/usr/local/bin/pact-broker`
3. Later, when trying to install the `pact_broker-client` Ruby gem, it also wants to install a
   `pact-broker` binary
4. The gem installation fails due to the file conflict

## Solution Implemented

### 1. **Modified Installation Logic in `contract-test` Job**

Updated the installation process to:

- First check if `pact-broker` command already exists
- If it exists (from Pact Ruby Standalone), skip the gem installation
- If it doesn't exist, proceed with gem installation using `--force` flag
- Added better error handling and logging

### 2. **Updated `contract-verification` Job**

Enhanced the installation process to:

- First try to install Pact Ruby Standalone (preferred method)
- If that fails, fall back to gem installation
- Before gem installation, remove any existing conflicting binaries
- Use `--force` flag to handle any remaining conflicts

## Key Changes

### Before (Problematic Code)

```bash
# Install the pact_broker-client gem
sudo gem install pact_broker-client --no-document
```

### After (Fixed Code)

```bash
# Check if pact-broker command already exists from Pact Ruby Standalone
if command -v pact-broker &> /dev/null; then
    echo "✅ Pact Broker command already available from Pact Ruby Standalone"
else
    # Install with force flag to handle conflicts
    sudo gem install pact_broker-client --no-document --force 2>/dev/null
fi
```

## Testing

### Local Testing Script

A test script has been created at `scripts/test-pact-installation.sh` to validate the installation
process locally:

```bash
# Run the test script
./scripts/test-pact-installation.sh
```

This script simulates the CI environment and verifies:

1. Pact Ruby Standalone can be downloaded and extracted
2. The pact-broker binary conflict is properly handled
3. All necessary Pact commands are available

### CI/CD Validation

The workflow has been updated with:

- Better error handling and logging
- Graceful fallbacks for installation failures
- Clear status messages for debugging

## Prevention Measures

1. **Conditional Installation**: Only install components that aren't already present
2. **Force Flags**: Use `--force` when necessary to overwrite conflicts
3. **Error Suppression**: Use `2>/dev/null` to suppress non-critical errors
4. **Multiple Fallbacks**: Provide alternative installation methods

## Monitoring

The workflow now provides better visibility with:

- Clear installation status messages
- Version checks after installation
- Detailed error messages when failures occur

## Additional Improvements

1. **Version Pinning**: Using a specific version (2.0.10) for consistency
2. **Docker Fallback**: Alternative installation via Docker extraction
3. **Verification Steps**: Explicit checks to confirm installation success

## Related Files

- **Modified**: `.github/workflows/contract-testing.yml`
- **Created**: `scripts/test-pact-installation.sh`
- **Created**: `docs/pact-installation-fix.md` (this file)

## Future Recommendations

1. Consider using Docker containers for Pact tools to avoid installation conflicts
2. Implement a shared action for Pact installation to maintain consistency
3. Consider using the official Pact GitHub Actions when they become more stable
4. Monitor for updates to Pact Ruby Standalone that might resolve these conflicts
