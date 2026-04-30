# Tool Permissions: Spec Parser

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | .md files in spec directory | Unlimited | Read specification Markdown |
| write | pipeline-artifacts/ specs/ | 30 req/min | Write structured-spec.json output |
| lsp_symbols | Workspace | 10 req/min | Find existing spec files by name |
| bash | git diff, head, wc | 10 req/min | Check git state of spec changes |

## Denied Tools
| Tool | Reason |
|------|--------|
| edit | Spec parsing is read → parse → write; no edits |
| webfetch | Not needed for spec parsing |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| git diff --name-only HEAD | Allowed | Check which spec files changed |
| head -n 5 \<path\> | Allowed | Preview spec file headers |
| wc -l \<path\> | Allowed | Check spec file size |
