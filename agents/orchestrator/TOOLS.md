# Tool Permissions: Orchestrator

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace (read-only) | Unlimited | Must read all spec files to decompose |
| lsp_symbols | Workspace-wide search | Unlimited | Pattern matching for existing code |
| ast_grep_search | All packages | Unlimited | Find existing patterns before routing |
| webfetch | External docs URLs | 30 req/min | Research for unfamiliar domains |
| call_omo_agent | All stewards (delegation) | 50 req/min | Primary routing mechanism |
| todowrite | Own session | N/A | Track decomposition progress |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Orchestrator never mutates code |
| edit | Orchestrator never mutates code |
| bash | Orchestrator never executes commands |
| ast_grep_replace | Orchestrator never mutates code |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| None | Denied | Orchestrator is pure planning, no shell access |
