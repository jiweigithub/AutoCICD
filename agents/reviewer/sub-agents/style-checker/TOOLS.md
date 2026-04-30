# Tool Permissions: Style Checker

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/ | Unlimited | Read generated code |
| bash | formatters, linters | 10 req/min | Run style checks |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Read-only analysis agent |
| edit | Read-only analysis agent |
| webfetch | Not needed |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm format:check | Allowed | Check prettier formatting |
| pnpm lint | Allowed | Run ESLint checks |
