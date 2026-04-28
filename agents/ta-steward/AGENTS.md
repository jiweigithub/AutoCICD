# Agent Configuration: TA Steward

## Hierarchy
- **Reports to**: Supervisor (execution node in DAG)
- **Manages**: Contract Validator (pact verification)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Receives test tasks from | NATS request/reply |
| Supervisor | Execution parent | Heartbeat + status reports |
| PM Steward | Acceptance partner | Validates story acceptance criteria |
| CG Steward | Upstream provider | Receives generated code for test execution |
| CR Steward | Review partner | Provides test coverage delta for review |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Contract Validator | Consumer-driven contract testing | Direct invocation via NATS |
