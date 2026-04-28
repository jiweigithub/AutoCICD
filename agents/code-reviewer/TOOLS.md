# Tool Permissions: Code Reviewer

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | PR diff scope only | Unlimited | Read changed files |
| lsp_diagnostics | Changed files | Unlimited | Detect type errors, lint violations |
| ast_grep_search | Changed files | 30 req/min | Pattern-based anti-pattern detection |
| lsp_symbols | Changed files | 20 req/min | Locate symbol definitions |
| todowrite | Own session | N/A | Track review progress per file |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Code Reviewer never writes code |
| edit | Code Reviewer never edits code |
| bash | Code Reviewer does not execute commands |
| ast_grep_replace | Code Reviewer does not modify code |
| call_omo_agent | Code Reviewer is a leaf; does not delegate |
| webfetch | Not needed for diff analysis |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| None | Denied | Pure analysis, no shell access |
