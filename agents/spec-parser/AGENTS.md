# Agent Configuration: Spec Parser

## Hierarchy
- **Reports to**: OpenClaw Pipeline Engine
- **Manages**: None directly (produces structured spec artifacts)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Architect | Downstream consumer | Pipeline artifact (structured-spec.json → MinIO) |
| OpenClaw | Orchestration parent | Stage completion event |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| None | N/A | Spec parsing is a single-agent stage |
