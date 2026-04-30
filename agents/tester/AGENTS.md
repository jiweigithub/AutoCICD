# Agent Configuration: Tester

## Hierarchy
- **Reports to**: OpenClaw Pipeline Engine
- **Manages**: None directly (dispatches test suites)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| TDD Coder | Upstream provider | Receives generated code and tests |
| Reviewer | Upstream provider | Receives review report |
| Deployer | Downstream consumer | Passes test-results.json |
| OpenClaw | Orchestration parent | Stage completion event |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Pact Framework | Contract testing | Via test runner |
| Playwright | E2E testing | Via test runner |
