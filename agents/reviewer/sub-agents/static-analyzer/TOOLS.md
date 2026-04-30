# Tool Permissions: Static Analyzer

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/ (full codebase) | Unlimited | Read code for analysis |
| bash | linters | 10 req/min | Run static analysis tools |
| lsp_symbols | Workspace | Unlimited | Navigate code structure |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Read-only analysis agent |
| edit | Read-only analysis agent |
| webfetch | Not needed |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| npx oxlint@latest \<path\> | Allowed | Run Rust-based linting |
| npx tsc --noEmit | Allowed | TypeScript type checking |
