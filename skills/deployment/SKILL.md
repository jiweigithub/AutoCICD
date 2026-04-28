---
name: deployment
description: Execute canary deployment with automatic metric-based rollback
triggers:
  - "deploy"
  - "canary release"
  - "rollout"
  - "ship it"
  - "deploy to production"
  - "traffic split"
---

# Canary Deployment with Auto-Rollback

## Purpose
Safely deploy a new service version using a canary release strategy. The deployment starts with a small percentage of traffic (default 5%) and gradually increases as canary metrics stay within healthy thresholds. If any metric exceeds its configured threshold, the deployment is automatically rolled back within 60 seconds without human intervention.

## Workflow
1. **Pre-deployment Checks**: Verify that the target environment is healthy (all pods ready, no active incidents), the review pipeline has passed (CR Steward signal green), and the test suite has passed (TA Steward signal green).
2. **Approval Gate**: Request deployment approval from the configured ApprovalGate. If manual approval is required for the target environment, block until approved or timeout.
3. **Snapshot Current Revision**: Record the current deployment revision (ArgoCD sync revision or Helm release revision) so rollback is a single operation.
4. **Canary Deploy**: Apply the new manifests with a canary traffic split. Start at the configured initial percentage (default 5%). Monitor canary metrics (error rate, latency p99, throughput, CPU/memory) for the configured canary duration.
5. **Metric Evaluation**: After the canary duration, evaluate all configured metrics against their thresholds. If all pass, promote to the next traffic percentage. If any fail, abort and roll back immediately.
6. **Full Promotion**: Once 100% traffic is reached and metrics are stable for the stabilization period (default 10 minutes), mark the deployment as complete and clean up the old revision.

## Constraints
- Production deployments always require a canary phase — direct production deploys are blocked.
- Canary duration must be at least 2 minutes per traffic step.
- If any canary metric exceeds its threshold, rollback must complete within 60 seconds.
- The previous revision must be retained for at least 10 minutes after full promotion.
- Approval gate override requires a documented incident ticket.

## Output
A deployment report:
```json
{
  "deployment_id": "string",
  "service": "string",
  "environment": "string",
  "version": "string",
  "canary_steps": [
    { "percentage": 5, "duration_ms": 0, "metrics_passed": true },
    { "percentage": 25, "duration_ms": 0, "metrics_passed": true },
    { "percentage": 50, "duration_ms": 0, "metrics_passed": true },
    { "percentage": 100, "duration_ms": 0, "metrics_passed": true }
  ],
  "status": "deployed | rolled_back | aborted",
  "rollback_reason": "string | null",
  "duration_ms": 0,
  "approval_id": "string"
}
```
