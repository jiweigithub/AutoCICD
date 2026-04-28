# Tool Permissions: Supervisor

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace (read-only) | Unlimited | Read DAG definitions, agent status |
| call_omo_agent | All stewards and specialists | 100 req/min | DAG node execution |
| bash | git status, git log only | 10 req/min | Check DAG branch state |
| background_output | Background task polling | Unlimited | Collect async agent results |
| background_cancel | Cancel runaway tasks | Unlimited | Timeout enforcement |
| session_list | All sessions | 20 req/min | Monitor agent session health |
| todowrite | Own session | N/A | Track DAG node execution |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Supervisor never writes code |
| edit | Supervisor never edits code |
| ast_grep_replace | Supervisor never mutates code |
| webfetch | Not needed for execution management |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| git status | Allowed | Check branch state before dispatch |
| git log --oneline | Allowed | Verify recent commits |
| git diff --stat | Allowed | Check change scope |
| git worktree list | Allowed | Monitor worktree leaks |
| pnpm test | Denied | Supervisor does not run tests; delegate to TA Steward |
| pnpm build | Denied | Supervisor does not build |
| kubectl * | Denied | Supervisor does not touch clusters |
