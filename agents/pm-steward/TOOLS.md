# Tool Permissions: PM Steward

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/shared/, docs/ | Unlimited | Read requirement specs, domain types |
| write | .ulw/backlog/, .ulw/sprints/ | 50 req/min | Write story and sprint artifacts |
| edit | .ulw/backlog/, .ulw/sprints/ | 50 req/min | Update story status and sprint plans |
| call_omo_agent | AD Steward, TA Steward | 30 req/min | Hand off stories for design or acceptance |
| todowrite | Own session | N/A | Track story lifecycle |
| lsp_symbols | Workspace | 20 req/min | Find existing stories by title |

## Denied Tools
| Tool | Reason |
|------|--------|
| bash | PM Steward does not execute shell commands |
| ast_grep_replace | PM Steward does not modify source code |
| webfetch | Not needed for backlog management |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| None | Denied | PM Steward is artifact-based, no shell access |
