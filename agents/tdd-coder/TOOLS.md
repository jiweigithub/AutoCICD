# Tool Permissions: TDD Coder

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/, pipeline-artifacts/ | Unlimited | Read architecture plan, domain types |
| write | packages/, tests/ | 50 req/min | Write generated code and tests |
| edit | packages/, tests/ | 50 req/min | Refactor generated code |
| bash | git, npm, pnpm, tsc | 20 req/min | Run tests, typecheck, git operations |
| lsp_symbols | Workspace | 20 req/min | Navigate codebase during generation |
| webfetch | API spec references | 5 req/min | Fetch external API reference docs |

## Denied Tools
| Tool | Reason |
|------|--------|
| None | TDD coder needs full tool access for code generation |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| git status | Allowed | Check worktree state |
| git add \<path\> | Allowed | Stage generated files |
| pnpm --filter \<pkg\> test | Allowed | Run TDD cycle tests |
| pnpm --filter \<pkg\> typecheck | Allowed | Verify type correctness |
| npx tsx \<path\> | Allowed | Run single test file |
