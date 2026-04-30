# Agent Configuration: Security Auditor

## Hierarchy
- **Reports to**: Reviewer (aggregation parent)
- **Manages**: None (single-responsibility analysis agent)

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Reviewer | Dispatch and aggregation | Finding report (inline) |
| Dependency Checker | Adjacent concern | Same pipeline stage |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| None | N/A | Self-contained security scanner |
