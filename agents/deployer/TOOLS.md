# Tool Permissions: Deployer

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | pipeline-artifacts/ | Unlimited | Read test-results.json, review-report.json |
| write | pipeline-artifacts/ | 20 req/min | Write deployment manifest |
| bash | kubectl, argocd, helm | 15 req/min | Execute deployments |
| webfetch | Container registry | 5 req/min | Check image availability |
| call_agent | Approval gates | 10 req/min | Request human approval |

## Denied Tools
| Tool | Reason |
|------|--------|
| edit | Deployer does not modify source code |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| kubectl apply -f \<path\> | Allowed | Apply K8s manifests |
| kubectl rollout status deployment/\<name\> | Allowed | Monitor rollout status |
| argocd app sync \<name\> | Allowed | Trigger ArgoCD sync |
| helm upgrade --install \<release\> \<chart\> | Allowed | Deploy via Helm |
