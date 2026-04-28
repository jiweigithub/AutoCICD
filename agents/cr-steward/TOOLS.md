# Tool Permissions: CR Steward

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace | Unlimited | Read PR diffs, review policies |
| call_omo_agent | Code Reviewer, Security Auditor, Contract Validator | 30 req/min | Parallel review dispatch |
| bash | git diff, git log | 20 req/min | Extract PR diffs for review |
| background_output | Specialist results | Unlimited | Aggregate parallel review findings |
| todowrite | Own session | N/A | Track review pipeline stages |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | CR Steward does not write code |
| edit | CR Steward does not edit code |
| ast_grep_replace | CR Steward does not modify code |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| git diff origin/main...HEAD | Allowed | Extract PR diff |
| git log origin/main..HEAD --oneline | Allowed | Review commit history |
| git show --stat HEAD | Allowed | Check changed files scope |
| pnpm test | Denied | Testing is TA Steward territory |
| pnpm build | Denied | Not needed for review |
