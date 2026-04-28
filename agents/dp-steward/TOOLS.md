# Tool Permissions: DP Steward

## Allowed Tools
| Tool | Scope | Rate Limit | Notes |
|------|-------|-----------|-------|
| read | infrastructure/, packages/acl/cicd-acl/ | Unlimited | Read deployment manifests, pipeline configs |
| call_omo_agent | Deploy Agent | 20 req/min | K8s execution |
| bash | kubectl, argocd, helm | 30 req/min | Cluster operations verification |
| background_output | Deploy Agent results | Unlimited | Monitor deployment progress |
| todowrite | Own session | N/A | Track deployment workflow |

## Denied Tools
| Tool | Reason |
|------|--------|
| write | DP Steward does not write manifests directly |
| edit | DP Steward does not edit source code |
| ast_grep_replace | DP Steward does not modify code |
| webfetch | Not needed for deployment |

## Bash Commands
| Command Pattern | Permission | Notes |
|----------------|------------|-------|
| kubectl get deployments -n * | Allowed | Check deployment status |
| kubectl get pods -n * | Allowed | Monitor pod health |
| kubectl describe deployment * | Allowed | Debug deployment issues |
| argocd app sync * | Allowed | Trigger ArgoCD sync |
| argocd app get * | Allowed | Check ArgoCD app status |
| helm list -n * | Allowed | List Helm releases |
| pnpm * | Denied | DP Steward does not build or test |
| git * | Denied | DP Steward operates on deployed artifacts |
