# Agent Configuration: DP Steward

## Hierarchy
- **Reports to**: Supervisor (execution node in DAG)
- **Manages**: Deploy Agent (K8s execution)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Receives deploy tasks from | NATS request/reply |
| Supervisor | Execution parent | Heartbeat + status reports |
| CR Steward | Upstream gate | Receives review pass/fail signal |
| TA Steward | Upstream gate | Receives test pass/fail signal |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Deploy Agent | K8s apply, canary, rollback | Direct invocation — DP Steward owns deployment workflow |
