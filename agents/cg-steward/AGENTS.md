# Agent Configuration: CG Steward

## Hierarchy
- **Reports to**: Supervisor (execution node in DAG)
- **Manages**: TDD Test Agent (test-first generation), OpenCode sessions (via opencode-acl)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Orchestrator | Receives codegen tasks from | NATS request/reply |
| Supervisor | Execution parent | Heartbeat + status reports |
| AD Steward | Upstream provider | Receives DDD specs + API contracts |
| CR Steward | Downstream handoff | Hands off completed PR for review |
| TA Steward | Test validation partner | Hands off generated code for test suite execution |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| TDD Test Agent | RED phase test generation | Direct invocation — CG Steward owns TDD state machine |
