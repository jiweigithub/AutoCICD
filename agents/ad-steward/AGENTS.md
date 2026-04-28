# Agent Configuration: AD Steward

## Hierarchy
- **Reports to**: Supervisor (execution node in DAG)
- **Manages**: None directly (generates architecture specs, not agents)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Receives design tasks from | NATS request/reply |
| Supervisor | Execution parent | Heartbeat + status reports |
| PM Steward | Upstream provider | Receives story requirements |
| CG Steward | Downstream consumer | Hands off DDD specs + OpenAPI contracts |
| Contract Validator | Validation partner | Validates generated API specs |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Contract Validator | OpenAPI spec validation | Direct invocation via NATS |
