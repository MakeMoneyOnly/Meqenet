#!/usr/bin/env python3
"""
Check toolchain parity across package.json settings.
Requirements enforced:
- engines.node must target Node 22
- pnpm major version must be 10 across packageManager, engines.pnpm and volta.pnpm
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
import re


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    pkg_path = root / "package.json"
    try:
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    except Exception as exc:  # pragma: no cover
        print(f"Failed to read {pkg_path}: {exc}")
        return 1

    engines = pkg.get("engines", {}) or {}
    package_manager = pkg.get("packageManager", "") or ""
    volta = pkg.get("volta", {}) or {}

    errors: list[str] = []

    node_engine = str(engines.get("node", ""))
    if "22" not in node_engine:
        errors.append(f"engines.node must target Node 22 (got: {node_engine})")

    pm_major = None
    m = re.search(r"pnpm@([0-9]+)", package_manager)
    if m:
        try:
            pm_major = int(m.group(1))
        except ValueError:
            pass

    volta_pnpm = volta.get("pnpm")
    volta_major = None
    if isinstance(volta_pnpm, str):
        try:
            volta_major = int(volta_pnpm.split(".")[0])
        except ValueError:
            pass

    engines_pnpm = str(engines.get("pnpm", ""))

    if pm_major is not None and pm_major != 10:
        errors.append(f"packageManager must pin pnpm@10.x (got {pm_major})")
    if volta_major is not None and volta_major != 10:
        errors.append(f"volta.pnpm must be 10.x (got {volta_major})")
    if "pnpm" in engines and "10" not in engines_pnpm:
        errors.append(f"engines.pnpm must allow 10.x (got {engines_pnpm})")

    if errors:
        print("Toolchain parity issues:\n - " + "\n - ".join(errors))
        return 1

    print("Toolchain parity OK (Node 22, pnpm 10)")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())


