# Tool Permissions: Tester

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/, tests/ | Unlimited | Read generated code and test files |
| write | pipeline-artifacts/ | 30 req/min | Write test-results.json |
| bash | test runners, coverage tools | 20 req/min | Run test suites |
| webfetch | Pact broker, API docs | 5 req/min | Fetch contract pacts |

## Denied Tools
| Tool | Reason |
|------|--------|
| edit | Tester does not modify code (only reads and tests) |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm test | Allowed | Run full test suite |
| pnpm --filter \<pkg\> test | Allowed | Run filtered package tests |
| pnpm --filter \<pkg\> test:coverage | Allowed | Run tests with coverage |
| npx vitest run --reporter=junit | Allowed | Generate JUnit report |
