#!/bin/bash

# Clean NPX Environment Variables Script
# Removes problematic npm config environment variables before running commands

# Function to clean npm environment variables
clean_npm_env() {
    unset npm_config_ignore_workspace_root_check 2>/dev/null || true
    unset npm_config_recursive 2>/dev/null || true
    unset npm_config_verify_deps_before_run 2>/dev/null || true
    
    # Set them to empty values to prevent warnings
    export npm_config_ignore_workspace_root_check=""
    export npm_config_recursive=""
    export npm_config_verify_deps_before_run=""
}

# Clean the environment
clean_npm_env

# Execute the command passed as arguments with clean environment
exec "$@"
