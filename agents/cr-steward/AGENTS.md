# Agent Configuration: CR Steward

## Hierarchy
- **Reports to**: Supervisor (execution node in DAG)
- **Manages**: Code Reviewer, Security Auditor, Contract Validator (parallel review dispatch)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Receives review tasks from | NATS request/reply |
| Supervisor | Execution parent | Heartbeat + status reports |
| CG Steward | Upstream provider | Receives PR for review |
| DP Steward | Downstream gate | Signals review pass/fail for deployment eligibility |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Code Reviewer | Diff analysis, style, logic | Parallel dispatch as review node |
| Security Auditor | SAST, secrets, dependency audit | Parallel dispatch as review node |
| Contract Validator | OpenAPI compliance | Parallel dispatch as review node |
