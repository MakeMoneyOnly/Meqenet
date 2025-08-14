#!/usr/bin/env python3
"""
Scan generated CycloneDX SBOMs for potential sensitive data leakage.

This is a defensive safeguard: SBOM formulation sections may include
emails or tokens. We scan for common indicators and fail the build if
any are detected, so devs can review and redact before distribution.

Usage:
  python governance/tools/scan_sbom.py [optional paths]

If no paths are passed, it searches for bom*.json in the repo root.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Iterable, List, Tuple, Pattern


EMAIL_REGEX = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
AWS_ACCESS_KEY_ID = re.compile(r"AKIA[0-9A-Z]{16}")
PRIVATE_KEY_MARKERS = (
    "-----BEGIN PRIVATE KEY-----",
    "-----BEGIN RSA PRIVATE KEY-----",
    "-----BEGIN EC PRIVATE KEY-----",
)
PASSWORD_FIELD = re.compile(r"\bpassword\b\s*[:=]\s*\"[^\"]{6,}\"", re.IGNORECASE)
SECRET_FIELD = re.compile(r"\b(secret|secretKey|secret_access_key|api[_-]?key|token)\b\s*[:=]\s*\"[^\"]{12,}\"", re.IGNORECASE)


def iter_strings(data: object) -> Iterable[str]:
    if isinstance(data, str):
        yield data
    elif isinstance(data, list):
        for item in data:
            yield from iter_strings(item)
    elif isinstance(data, dict):
        for k, v in data.items():
            # include keys and values for scanning
            if isinstance(k, str):
                yield k
            yield from iter_strings(v)


def scan_text(text: str) -> List[Tuple[str, str]]:
    findings: List[Tuple[str, str]] = []
    if EMAIL_REGEX.search(text):
        findings.append(("email", EMAIL_REGEX.search(text).group(0)))
    if AWS_ACCESS_KEY_ID.search(text):
        findings.append(("aws_access_key_id", AWS_ACCESS_KEY_ID.search(text).group(0)))
    for marker in PRIVATE_KEY_MARKERS:
        if marker in text:
            findings.append(("private_key_marker", marker))
            break
    if PASSWORD_FIELD.search(text):
        findings.append(("password_field", PASSWORD_FIELD.search(text).group(0)))
    if SECRET_FIELD.search(text):
        findings.append(("secret_field", SECRET_FIELD.search(text).group(0)))
    return findings


def load_allowlist(root: Path) -> List[Pattern[str]]:
    allowlist_file = root / "governance" / "tools" / "scan_sbom_allowlist.txt"
    patterns: List[Pattern[str]] = []
    if allowlist_file.exists():
        for line in allowlist_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                patterns.append(re.compile(line, re.IGNORECASE))
            except re.error:
                print(f"[scan-sbom] Skipping invalid regex in allowlist: {line}", file=sys.stderr)
    return patterns


def is_allowed(sample: str, allowlist: List[Pattern[str]]) -> bool:
    return any(p.search(sample) for p in allowlist)


def scan_bom_file(path: Path, allowlist: List[Pattern[str]]) -> List[Tuple[str, str, str]]:
    issues: List[Tuple[str, str, str]] = []
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
        # Quick scan on raw text (captures markers/fields even outside JSON locations)
        for kind, sample in scan_text(content):
            if not is_allowed(sample, allowlist):
                issues.append((path.name, kind, sample[:120]))

        # Structured scan for string values
        try:
            data = json.loads(content)
            for s in iter_strings(data):
                for kind, sample in scan_text(s):
                    if not is_allowed(sample, allowlist):
                        issues.append((path.name, kind, sample[:120]))
        except Exception:
            # non-fatal: keep text-based findings only
            pass
    except Exception as e:
        print(f"[scan-sbom] Failed to read {path}: {e}", file=sys.stderr)
    return issues


def main() -> int:
    root = Path.cwd()
    targets = [Path(p) for p in sys.argv[1:]]
    if not targets:
        targets = list(root.glob("bom*.json"))

    if not targets:
        print("[scan-sbom] No SBOM files found (bom*.json). Skipping.")
        return 0

    allowlist = load_allowlist(root)
    if allowlist:
        print(f"[scan-sbom] Using allowlist with {len(allowlist)} pattern(s)")

    all_issues: List[Tuple[str, str, str]] = []
    for p in targets:
        if p.exists() and p.is_file():
            issues = scan_bom_file(p, allowlist)
            all_issues.extend(issues)

    if not all_issues:
        print("[scan-sbom] OK: No sensitive indicators detected in SBOMs.")
        return 0

    print("[scan-sbom] Potential sensitive data detected in SBOMs:")
    for fname, kind, sample in all_issues[:50]:
        print(f"  - {fname}: {kind}: {sample}")
    print("[scan-sbom] FAIL: Please review and redact formulation sections before distribution.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())


