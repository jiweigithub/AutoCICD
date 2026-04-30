# Tool Permissions: Dependency Checker

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | package.json, pnpm-lock.yaml | Unlimited | Read dependency manifests |
| bash | dependency audit tools | 10 req/min | Run vulnerability scans |
| webfetch | OSV.dev, NVD | 5 req/min | Fetch CVE data |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Read-only analysis agent |
| edit | Read-only analysis agent |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm audit | Allowed | Check for vulnerable packages |
| pnpm licenses list | Allowed | Check dependency licenses |
| npx npm-check-updates | Allowed | Check for outdated packages |
