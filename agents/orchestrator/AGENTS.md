# Agent Configuration: Orchestrator

## Hierarchy
- **Reports to**: Human (via platform API)
- **Manages**: Supervisor (execution delegate), all 6 BC Stewards (routing targets)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Supervisor | Delegate (plans dispatched to) | DAG over NATS JetStream |
| PM Steward | Routing target | Story decomposition request/response |
| AD Steward | Routing target | Architecture design task |
| CG Steward | Routing target | Code generation task |
| CR Steward | Routing target | Review pipeline task |
| TA Steward | Routing target | Test suite execution task |
| DP Steward | Routing target | Deployment pipeline task |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Code Reviewer | Diff analysis in review pipeline | Routed via CR Steward only |
| TDD Test Agent | Test-first generation | Routed via CG Steward only |
| Security Auditor | SAST / secrets / dependency scan | Routed via CR Steward only |
| Contract Validator | OpenAPI compliance checks | Routed via CR Steward or TA Steward |
| Deploy Agent | K8s execution | Routed via DP Steward only |
