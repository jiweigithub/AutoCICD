# Tool Permissions: Security Auditor

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace | Unlimited | Read dependency manifests, source files |
| bash | pnpm audit, trivy, gitleaks | 20 req/min | Run security scanning tools |
| ast_grep_search | All source files | 30 req/min | Pattern search for secrets patterns, unsafe APIs |
| lsp_diagnostics | Security-critical files | 20 req/min | Detect type-level security issues |
| webfetch | CVE databases (nvd.nist.gov, osv.dev) | 10 req/min | Look up CVE details |
| todowrite | Own session | N/A | Track scan progress |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Security Auditor never writes code |
| edit | Security Auditor never edits code |
| ast_grep_replace | Security Auditor never modifies code |
| call_omo_agent | Security Auditor is a leaf specialist |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm audit | Allowed | NPM dependency vulnerability scan |
| pnpm audit --fix | Denied | Fixing is CG Steward territory |
| trivy fs --severity HIGH,CRITICAL . | Allowed | SAST filesystem scan |
| gitleaks detect --no-git | Allowed | Hardcoded secrets detection |
| npm ls --all | Allowed | Dependency tree analysis |
