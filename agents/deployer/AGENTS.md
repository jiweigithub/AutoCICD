# Agent Configuration: Deployer

## Hierarchy
- **Reports to**: OpenClaw Pipeline Engine
- **Manages**: Canary deployment lifecycle

## Peers
| Agent | Relationship | Communication Protocol |
|-------|-------------|----------------------|
| Tester | Upstream provider | Receives test-results.json |
| OpenClaw | Orchestration parent | Stage completion event, approval gate |
| ArgoCD | Deployment executor | Via CI/CD adapter |
| K8s | Target runtime | Via K8s client |

## Specialists
| Specialist | Available For | How to Invoke |
|-----------|---------------|---------------|
| ArgoCD | GitOps sync management | Via ArgoClient ACL |
| K8s API | Pod/deployment management | Via K8sClient ACL |
