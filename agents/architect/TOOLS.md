# Tool Permissions: Architect

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | pipeline-artifacts/ | Unlimited | Read structured-spec.json |
| write | pipeline-artifacts/ | 30 req/min | Write architecture-plan.json |
| lsp_symbols | Workspace | 10 req/min | Reference existing architecture patterns |
| bash | validation commands | 10 req/min | Validate output against schema |

## Denied Tools
| Tool | Reason |
|------|--------|
| edit | Architecture design is read → plan → write; no code edits |
| webfetch | Not needed for design work |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| head -n 20 \<path\> | Allowed | Preview spec or existing plan |
