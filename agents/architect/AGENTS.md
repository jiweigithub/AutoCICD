# Agent Configuration: Architect

## Hierarchy
- **Reports to**: OpenClaw Pipeline Engine
- **Manages**: None directly (produces architecture plan artifacts)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Spec Parser | Upstream provider | Reads structured-spec.json from MinIO |
| TDD Coder | Downstream consumer | Writes architecture-plan.json to MinIO |
| OpenClaw | Orchestration parent | Stage completion event |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| None | N/A | Architecture design is a single-agent stage |
