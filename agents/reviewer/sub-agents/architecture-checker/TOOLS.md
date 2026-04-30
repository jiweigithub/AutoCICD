# Tool Permissions: Architecture Checker

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/, pipeline-artifacts/ | Unlimited | Read architecture plan, generated code |
| lsp_symbols | Workspace | Unlimited | Navigate module structure |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Read-only analysis agent |
| edit | Read-only analysis agent |
| bash | Architecture analysis is symbolic, not shell-based |
| webfetch | Not needed |
