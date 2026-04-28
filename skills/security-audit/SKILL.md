---
name: security-audit
description: Run SAST, secrets scanning, and dependency vulnerability audit on a codebase
triggers:
  - "security scan"
  - "audit dependencies"
  - "check for secrets"
  - "SAST analysis"
  - "vulnerability check"
  - "security review"
  - "scan for CVEs"
---

# Security Audit Pipeline

## Purpose
Scan every commit and pull request for security vulnerabilities using three independent checks: SAST (static application security testing), hardcoded secrets detection, and dependency vulnerability audit. The Security Auditor specialist runs all three checks and produces a unified security report with actionable remediation steps.

## Workflow
1. **SAST Scan**: Run `trivy fs` against the repository root with severity thresholds set to HIGH and CRITICAL. Scan for OWASP Top 10 patterns, injection vulnerabilities, insecure deserialization, and misconfigured security headers.
2. **Secrets Detection**: Run `gitleaks detect` to find hardcoded API keys, tokens, passwords, private keys, and connection strings. Flag any finding — even low-confidence matches require human verification.
3. **Dependency Audit**: Run `pnpm audit` to check for known CVEs in direct and transitive dependencies. For each critical or high CVE, query the NVD (nvd.nist.gov) or OSV (osv.dev) for details and remediation guidance.
4. **AST Pattern Scan**: Use AST grep to search for unsafe patterns: `eval()`, `innerHTML`, raw SQL concatenation, disabled TLS verification, and missing CSP headers.
5. **Report Generation**: Aggregate all findings, deduplicate across scanners, and produce a structured report with severity-ranked findings.

## Constraints
- Any critical-severity CVE in a direct dependency blocks the pipeline.
- Any hardcoded secret (high-confidence match) blocks the pipeline.
- SAST and secrets scans must run independently; one scanner's failure does not skip the other.
- Dependency audit must check both production and dev dependencies (dev deps can leak into builds).

## Output
A security audit report:
```json
{
  "target": "string (PR number or commit SHA)",
  "sast": { "critical": 0, "high": 0, "medium": 0, "findings": [] },
  "secrets": { "total_findings": 0, "high_confidence": 0, "findings": [] },
  "dependencies": { "critical_cves": 0, "high_cves": 0, "cves": [] },
  "patterns": { "unsafe_patterns": [] },
  "status": "pass | fail",
  "remediation_required": []
}
```
