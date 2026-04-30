# Tool Permissions: Contract Validator

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/, pipeline-artifacts/ | Unlimited | Read OpenAPI specs, generated code |
| bash | test runners | 10 req/min | Run contract validation |
| webfetch | Pact broker | 5 req/min | Fetch consumer pacts |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Read-only validation agent |
| edit | Read-only validation agent |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| npx pact-broker can-i-deploy | Allowed | Check consumer compatibility |
| pnpm --filter \<pkg\> test:contract | Allowed | Run contract tests |
