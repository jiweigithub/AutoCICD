# Agent Configuration: TDD Coder

## Hierarchy
- **Reports to**: OpenClaw Pipeline Engine
- **Manages**: OpenCode sessions for isolated code generation

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Architect | Upstream provider | Reads architecture-plan.json from MinIO |
| Reviewer | Downstream consumer | Writes generated code to worktree, signals review |
| Tester | Downstream consumer | Generated code consumed by test stage |
| OpenClaw | Orchestration parent | Stage completion event |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| OpenCode Runtime | TDD session management | ACL: OpenCodeAdapter |
