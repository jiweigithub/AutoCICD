# Tool Permissions: TDD Test Agent

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Target package src/ | Unlimited | Read OpenAPI specs, domain types |
| write | Target package src/**/*.test.ts | 50 req/min | Generate test files |
| edit | Target package src/**/*.test.ts | 50 req/min | Refine test assertions |
| bash | pnpm test --filter * | 30 req/min | Run tests to verify RED then GREEN |
| lsp_diagnostics | Test files | Unlimited | Ensure test files compile |
| ast_grep_search | Target package | 10 req/min | Find existing test patterns |
| todowrite | Own session | N/A | Track test generation progress |

## Denied Tools
| Tool | Reason |
|------|--------|
| write (on non-test files) | TDD Test Agent never writes production code |
| edit (on non-test files) | TDD Test Agent never edits production code |
| ast_grep_replace | TDD Test Agent does not refactor |
| call_omo_agent | TDD Test Agent is a leaf specialist |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm test --filter * | Allowed | Run tests to confirm RED (fail) then GREEN (pass) |
| pnpm vitest --reporter verbose | Allowed | Detailed test output for debugging |
| git * | Denied | TDD Test Agent does not manage version control |
| pnpm build | Denied | Only runs tests, does not build |
