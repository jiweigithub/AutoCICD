# Tool Permissions: TA Steward

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace | Unlimited | Read OpenAPI specs, test files |
| write | packages/bc/*/src/**/*.test.ts | 80 req/min | Generate test files |
| edit | packages/bc/*/src/**/*.test.ts | 80 req/min | Update test cases |
| call_omo_agent | Contract Validator | 10 req/min | Pact verification |
| bash | pnpm test, vitest | 50 req/min | Run test suites |
| lsp_diagnostics | Test files | Unlimited | Verify test files are error-free |
| todowrite | Own session | N/A | Track test execution |

## Denied Tools
| Tool | Reason |
|------|--------|
| ast_grep_replace | TA Steward generates tests, does not refactor production code |
| webfetch | Not needed for test automation |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm test | Allowed | Run full test suite |
| pnpm test --filter * | Allowed | Run specific package tests |
| pnpm vitest --coverage | Allowed | Generate coverage reports |
| pnpm typecheck | Allowed | Verify type safety of test files |
| git * | Denied | TA Steward does not manage git |
| kubectl * | Denied | Not needed for testing |
