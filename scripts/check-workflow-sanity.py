#!/usr/bin/env python3

import os
import re
import sys

def check_workflow_sanity():
    base = os.path.join('.github', 'workflows')
    missing = []

    if not os.path.isdir(base):
        print('CI workflows missing (.github/workflows)')
        sys.exit(1)

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
        node22_direct = ('node-version: 22' in content) or ("node-version: '22'" in content) or ('node-version: "22"' in content)
        has_node_env = ('NODE_VERSION: 22' in content) or ("NODE_VERSION: '22'" in content) or ('NODE_VERSION: "22"' in content)
        uses_node_env = 'node-version: ${{ env.NODE_VERSION }}' in content
        node22 = node22_direct or (has_node_env and uses_node_env)
        has_corepack = ('corepack enable' in content)

        # Validate pnpm version in workflows (must be 10.x if specified)
        bad_pnpm = False
        if has_pnpm:
            m = re.search(r'pnpm/action-setup@[^\n]+\n\s*with:\s*\n\s*version:\s*["\']?(\d+(?:\.\d+)*)', content, re.S)
            if m:
                v = m.group(1)
                bad_pnpm = (v.split('.')[0] != '10')

        reasons = []
        if not has_pnpm:
            reasons.append('pnpm/action-setup missing')
        if not has_node:
            reasons.append('actions/setup-node missing')
        if not node22:
            reasons.append('node-version 22 missing')
        if not has_corepack:
            reasons.append('corepack enable missing')
        if bad_pnpm:
            reasons.append('pnpm version 10.x required in pnpm/action-setup')

        if reasons:
            missing.append((fname, ', '.join(reasons)))

    if missing:
        print('CI workflow parity issues found:')
        for n, r in missing:
            print(f' - {n}: {r}')
        return False
    else:
        print('All workflows contain pnpm setup, Node 22, and corepack enable')
        return True

if __name__ == '__main__':
    success = check_workflow_sanity()
    sys.exit(0 if success else 1)
