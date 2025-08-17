#!/usr/bin/env python3
"""
Lint Dockerfiles and compose files for disallowed flags.
Flags prohibited:
- --network=host
- privileged: true
- network: host (Compose build option)
"""
from __future__ import annotations

import os
import sys
from pathlib import Path


DISALLOWED = ["--network=host", "privileged: true", "network: host"]


def scan_file(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []
    return [flag for flag in DISALLOWED if flag in text]


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    bad: list[tuple[Path, list[str]]] = []

    for root, _dirs, files in os.walk(repo_root):
        for fname in files:
            if fname.endswith("Dockerfile") or fname in ("docker-compose.yml", "docker-compose.yaml"):
                path = Path(root) / fname
                hits = scan_file(path)
                if hits:
                    bad.append((path.relative_to(repo_root), hits))

    if bad:
        print("Disallowed Docker flags found:")
        for p, hits in bad:
            print(f"- {p}: {', '.join(hits)}")
        return 1

    print("Dockerfile policy OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())


