import os
import re

base = os.path.join('.github', 'workflows')
missing = []

if os.path.isdir(base):
    for fname in os.listdir(base):
        if not (fname.endswith('.yml') or fname.endswith('.yaml')):
            continue
        path = os.path.join(base, fname)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            missing.append((fname, f'read-error: {e}'))
            continue
        
        has_pnpm = 'pnpm/action-setup@' in content
        has_node = 'actions/setup-node@' in content
        # Check for either direct node-version: 22 or NODE_VERSION: "22" environment variable
        node22_direct = re.search(r'node-version:\s*[\'\"]*22', content) is not None
        has_node_env = re.search(r'NODE_VERSION:\s*[\'\"]*22[\'\"]*', content) is not None
        uses_node_env = re.search(r'node-version:\s*\$\{\{\s*env\.NODE_VERSION\s*\}\}', content) is not None
        node22 = node22_direct or (has_node_env and uses_node_env)
        has_corepack = re.search(r'\bcorepack enable\b', content) is not None
        
        if not (has_pnpm and has_node and node22 and has_corepack):
            reasons = []
            if not has_pnpm: 
                reasons.append('pnpm/action-setup missing')
            if not has_node: 
                reasons.append('actions/setup-node missing')
            if not node22: 
                reasons.append('node-version 22 missing')
            if not has_corepack: 
                reasons.append('corepack enable missing')
            missing.append((fname, ', '.join(reasons)))

if missing:
    print('CI workflow parity issues found:')
    for n, r in missing:
        print(f' - {n}: {r}')
else:
    print('All workflows contain pnpm setup, Node 22, and corepack enable')
