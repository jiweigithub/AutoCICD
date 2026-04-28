# Tool Permissions: CG Steward

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace | Unlimited | Read DDD specs, existing code |
| write | packages/bc/*/src/ | 100 req/min | Generate implementation code |
| edit | packages/bc/*/src/ | 100 req/min | Refactor during REFACTOR phase |
| ast_grep_replace | packages/bc/ | 50 req/min | Pattern-based refactoring |
| call_omo_agent | TDD Test Agent, opencode-acl sessions | 30 req/min | Test generation and codegen sessions |
| bash | git worktree, pnpm test | 30 req/min | Worktree management, test execution |
| todowrite | Own session | N/A | Track TDD phase transitions |
| lsp_diagnostics | Changed files | Unlimited | Verify no errors before GREEN→REFACTOR |

## Denied Tools
| Tool | Reason |
|------|--------|
| webfetch | Code generation does not require web content |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| git worktree add * | Allowed | Create isolated worktrees |
| git worktree remove * | Allowed | Clean up after session |
| git worktree prune | Allowed | Remove stale worktrees |
| git checkout -b * | Allowed | Create feature branches in worktrees |
| pnpm test --filter * | Allowed | Run tests during RED→GREEN phase |
| pnpm typecheck | Allowed | Type check before GREEN→REFACTOR |
| pnpm build | Denied | CG Steward tests, does not build artifacts |
| kubectl * | Denied | Deployment is DP Steward territory |
