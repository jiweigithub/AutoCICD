# Agent Configuration: PM Steward

## Hierarchy
- **Reports to**: Supervisor (execution node in DAG)
- **Manages**: None directly (orchestrates story lifecycle, not agents)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Receives decomposition from | NATS request/reply |
| Supervisor | Execution parent | Heartbeat + status reports |
| AD Steward | Downstream consumer | Story handoff (backlog item → architecture spec) |
| TA Steward | Acceptance partner | Story acceptance criteria → test validation |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| None | N/A | PM Steward owns planning logic directly |
