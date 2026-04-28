# Agent Configuration: Security Auditor

## Hierarchy
- **Reports to**: CR Steward
- **Manages**: None

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| CR Steward | Parent steward | Receives security scan dispatch, returns findings |
| Code Reviewer | Peer specialist | Operates in parallel during review pipeline |
| Contract Validator | Peer specialist | Operates in parallel during review pipeline |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| None | N/A | Security Auditor is a leaf specialist |
