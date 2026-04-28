# Agent Configuration: Contract Validator

## Hierarchy
- **Reports to**: CR Steward (review pipeline) or TA Steward (pact verification)
- **Manages**: None

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| CR Steward | Parent steward (review) | Receives contract validation dispatch |
| TA Steward | Parent steward (testing) | Receives pact verification dispatch |
| Code Reviewer | Peer specialist | Operates in parallel during review pipeline |
| Security Auditor | Peer specialist | Operates in parallel during review pipeline |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| None | N/A | Contract Validator is a leaf specialist |
