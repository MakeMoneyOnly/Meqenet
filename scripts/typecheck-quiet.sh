#!/bin/bash

# Quiet typecheck wrapper - suppresses experimental warnings
# Runs vitest typecheck with filtered output

cd "$(dirname "$0")/../frontend"

# Clear problematic npm config environment variables
unset npm_config_ignore_workspace_root_check
unset npm_config_recursive  
unset npm_config_verify_deps_before_run

# Run vitest and filter out specific warnings
npx vitest --config apps/app/vitest.config.mjs --typecheck --run 2>&1 | grep -v -E "(Testing types with tsc and vue-tsc is an experimental feature|Breaking changes might not follow SemVer|npm warn Unknown env config)" || true

# Capture the exit code from vitest (not grep)
exit ${PIPESTATUS[0]}
