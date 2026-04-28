# Tool Permissions: Deploy Agent

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | infrastructure/manifests/ | Unlimited | Read K8s manifests, Helm values |
| bash | kubectl, argocd, helm | 50 req/min | Cluster operations |
| todowrite | Own session | N/A | Track deployment steps |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | Deploy Agent applies manifests, does not author them |
| edit | Deploy Agent does not edit source files |
| ast_grep_replace | Deploy Agent does not modify code |
| call_omo_agent | Deploy Agent is a leaf specialist |
| webfetch | Not needed for cluster operations |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| kubectl apply -f * | Allowed | Apply K8s manifests |
| kubectl diff -f * | Allowed | Dry-run diff before apply |
| kubectl rollout status deployment/* -n * | Allowed | Monitor rollout progress |
| kubectl rollout undo deployment/* -n * | Allowed | Rollback on failure |
| kubectl scale deployment/* --replicas=* -n * | Allowed | Canary traffic control |
| kubectl get events -n * --sort-by=.lastTimestamp | Allowed | Debug cluster issues |
| kubectl logs deployment/* -n * --tail=50 | Allowed | Collect pod logs |
| argocd app sync * | Allowed | Trigger ArgoCD sync |
| argocd app rollback * | Allowed | ArgoCD rollback |
| helm upgrade --install * | Allowed | Helm-based deployments |
| helm rollback * | Allowed | Helm rollback |
| kubectl delete * | Allowed (with caution) | Cleanup on rollback |
| kubectl delete namespace * | Denied | Never delete namespaces automatically |
| kubectl delete pvc * | Denied | Never delete persistent volumes |
| pnpm * | Denied | Deploy Agent does not build or test |
