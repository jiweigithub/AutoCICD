# Tool Permissions: Reviewer

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | packages/ (full codebase) | Unlimited | Read generated code for review |
| write | pipeline-artifacts/ | 30 req/min | Write review-report.json |
| bash | linters, analyzers | 20 req/min | Run static analysis and linting |
| lsp_symbols | Workspace | Unlimited | Navigate code for review |
| call_agent | 6 review sub-agents | Parallel dispatch | Dispatch to specialist reviewers |

## Denied Tools
| Tool | Reason |
|------|--------|
| edit | Reviewer does not modify code |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| pnpm lint | Allowed | Run general linting |
| pnpm format:check | Allowed | Check formatting |
| npx oxlint@latest \<path\> | Allowed | Run Oxlint analysis |
