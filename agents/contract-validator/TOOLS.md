# Tool Permissions: Contract Validator

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | OpenAPI specs, implementation source | Unlimited | Read contracts and code |
| bash | spectral lint, pact verification | 20 req/min | Run contract validation tools |
| ast_grep_search | API route handlers | 20 req/min | Find API implementations for spec comparison |
| lsp_symbols | Workspace | 10 req/min | Locate route handler symbols |
| todowrite | Own session | N/A | Track validation progress |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Contract Validator never writes code or specs |
| edit | Contract Validator never edits code or specs |
| ast_grep_replace | Contract Validator never modifies code |
| call_omo_agent | Contract Validator is a leaf specialist |
| webfetch | Not needed for contract validation |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| spectral lint *.yaml | Allowed | Validate OpenAPI spec compliance |
| spectral lint *.json | Allowed | Validate OpenAPI spec compliance |
| npx pact-broker can-i-deploy * | Allowed | Check contract compatibility |
| pnpm test --filter * -- contracts | Allowed | Run contract test suites |
| pnpm build | Denied | Not needed for validation |
| git * | Denied | Not needed for contract checking |
