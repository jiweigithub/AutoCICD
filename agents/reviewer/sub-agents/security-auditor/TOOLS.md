# Tool Permissions: Security Auditor

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/, .ulw/security/ | Unlimited | Read code and security policies |
| webfetch | NVD, OSV.dev | 10 req/min | Fetch CVE data |
| bash | semgrep, secret scanners | 10 req/min | Run security scans |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Read-only security analysis |
| edit | Read-only security analysis |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| semgrep --config=auto \<path\> | Allowed | Run semgrep SAST scan |
| semgrep --config=\<policy\> \<path\> | Allowed | Run custom policy scan |
