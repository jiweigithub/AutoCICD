# Agent Configuration: Contract Validator

## Hierarchy
- **Reports to**: Reviewer (aggregation parent)
- **Manages**: None (single-responsibility analysis agent)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Reviewer | Dispatch and aggregation | Finding report (inline) |
| Architecture Checker | Adjacent concern | Same pipeline stage |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| Pact Framework | Contract test generation | Via test runner |
