# Agent Configuration: Supervisor

## Hierarchy
- **Reports to**: Orchestrator
- **Manages**: All 6 BC Stewards (DAG execution), all 5 Tier 4 Specialists (via Stewards)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Upstream planner | Receives DAG via NATS, returns execution report |
| PM Steward | Executor node | Heartbeat + task dispatch via NATS request/reply |
| AD Steward | Executor node | Heartbeat + task dispatch via NATS request/reply |
| CG Steward | Executor node | Heartbeat + task dispatch via NATS request/reply |
| CR Steward | Executor node | Heartbeat + task dispatch via NATS request/reply |
| TA Steward | Executor node | Heartbeat + task dispatch via NATS request/reply |
| DP Steward | Executor node | Heartbeat + task dispatch via NATS request/reply |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Code Reviewer | Not directly managed | Invoked by CR Steward |
| TDD Test Agent | Not directly managed | Invoked by CG Steward |
| Security Auditor | Not directly managed | Invoked by CR Steward |
| Contract Validator | Not directly managed | Invoked by CR Steward or TA Steward |
| Deploy Agent | Not directly managed | Invoked by DP Steward |
