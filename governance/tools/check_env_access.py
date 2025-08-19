#!/usr/bin/env python3
"""
Centralized Environment Variable Access Enforcement
Ensures all process.env usage is contained within shared/config files only

This script enforces enterprise FinTech governance rules for environment variable access:
- ONLY files in /shared/config/ directories are allowed to access process.env
- All other files must use ConfigService dependency injection
- node_modules, test files, and build artifacts are excluded from checks

Author: Meqenet.et DevOps & Security Team
"""

import os
import sys
from pathlib import Path

def check_centralized_env_access():
    """Check for unauthorized process.env usage outside shared/config directories"""
    
    bad_files = []
    backend_dir = Path('backend')
    
    if not backend_dir.exists():
        print("Backend directory not found")
        return True
    
    # Walk through all backend files
    for root, dirs, files in os.walk(backend_dir):
        # Skip node_modules at any level
        if 'node_modules' in root:
            continue
            
        # Prune unwanted directories from further traversal
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', 'build', 'coverage')]
        
        for file in files:
            # Only check TypeScript source files
            if not file.endswith('.ts') or file.endswith('.d.ts'):
                continue
                
            file_path = os.path.join(root, file)
            normalized_path = file_path.replace('\\', '/')
            
            # Skip test files and setup scripts
            if any(pattern in normalized_path for pattern in ['/test/', '.spec.ts', 'setup.ts']):
                continue
            
            # Check if file is in allowed config directory
            is_config_file = '/shared/config/' in normalized_path
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                # Check for process.env usage
                if 'process.env' in content:
                    if not is_config_file:
                        bad_files.append(normalized_path)
                    
            except Exception as e:
                # Skip files that can't be read
                continue
    
    # Report results
    if bad_files:
        print("FAILED: Disallowed process.env usage found in:")
        for file_path in sorted(bad_files):
            print(f"   - {file_path}")
        print("\nFix: Move process.env access to centralized config files in /shared/config/ directories")
        print("   Use ConfigService dependency injection in other files")
        return False
    else:
        print("PASSED: Centralized env access: OK")
        return True

if __name__ == "__main__":
    success = check_centralized_env_access()
    sys.exit(0 if success else 1)
