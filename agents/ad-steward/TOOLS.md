# Tool Permissions: AD Steward

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | Full workspace | Unlimited | Read domain models, existing specs |
| write | .ulw/architecture/, packages/shared/domain/ | 30 req/min | Write DDD specs, OpenAPI contracts |
| edit | .ulw/architecture/, packages/shared/domain/ | 50 req/min | Update architecture specs |
| call_omo_agent | Contract Validator | 10 req/min | Validate generated specs |
| ast_grep_search | packages/ | 20 req/min | Find existing domain patterns |
| lsp_symbols | Workspace | 20 req/min | Locate domain types |
| todowrite | Own session | N/A | Track design progress |

## Denied Tools
| Tool | Reason |
|------|--------|
| bash | AD Steward does not execute commands or run builds |
| ast_grep_replace | AD Steward does not modify implementation code |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| None | Denied | Design is file-based, no shell needed |
