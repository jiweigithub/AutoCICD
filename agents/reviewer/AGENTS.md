# Agent Configuration: Reviewer

## Hierarchy
- **Reports to**: OpenClaw Pipeline Engine
- **Manages**: 6 review sub-agents (static-analyzer, security-auditor, contract-validator, architecture-checker, style-checker, dependency-checker)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| TDD Coder | Upstream provider | Receives generated code |
| Tester | Downstream consumer | Passes review-report.json |
| OpenClaw | Orchestration parent | Stage completion event |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Static Analyzer | Code correctness analysis | Parallel dispatch by stage |
| Security Auditor | Vulnerability scanning | Parallel dispatch by stage |
| Contract Validator | API contract compliance | Parallel dispatch by stage |
| Architecture Checker | Design pattern compliance | Parallel dispatch by stage |
| Style Checker | Code style verification | Parallel dispatch by stage |
| Dependency Checker | Dependency vulnerability scan | Parallel dispatch by stage |
