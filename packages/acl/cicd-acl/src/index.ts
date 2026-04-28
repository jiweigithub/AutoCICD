/**
 * ACL for CI/CD pipeline execution.
 * Translates ulw deployment commands into K8s / ArgoCD operations.
 */

/**
 * Translates ulw deployment workflows into CI/CD platform operations.
 */
export interface UlwCicdAdapter {
  /** Deploy a service to the target environment. */
  deploy(input: DeployInput): Promise<DeployResult>;

  /** Roll back the last deployment. */
  rollback(service: string, environment: string): Promise<RollbackResult>;

  /** Get the current deployment status for a service. */
  getStatus(service: string, environment: string): Promise<DeploymentStatus>;

  /** Run a canary deployment with traffic splitting. */
  canaryDeploy(input: CanaryInput): Promise<DeployResult>;

  /** Promote a canary to full production. */
  promoteCanary(service: string, environment: string): Promise<void>;

  /** Abort an in-progress canary and roll back. */
  abortCanary(service: string, environment: string): Promise<void>;
}

export interface DeployInput {
  service: string;
  version: string;
  environment: string;
  manifestPath: string;
  dryRun?: boolean;
}

export interface CanaryInput {
  service: string;
  version: string;
  environment: string;
  manifestPath: string;
  canaryPercentage: number;
  canaryDurationMs: number;
  metrics: CanaryMetric[];
}

export interface CanaryMetric {
  name: string;
  query: string;
  threshold: number;
  comparator: 'lt' | 'gt' | 'lte' | 'gte';
}

export interface DeployResult {
  success: boolean;
  deploymentId: string;
  status: DeploymentStatus;
  message?: string;
}

export interface RollbackResult {
  success: boolean;
  previousVersion: string;
  status: DeploymentStatus;
}

export interface DeploymentStatus {
  service: string;
  environment: string;
  version: string;
  phase: 'pending' | 'progressing' | 'healthy' | 'degraded' | 'failed';
  replicas: ReplicaStatus;
  startedAt: number;
  completedAt?: number;
}

export interface ReplicaStatus {
  desired: number;
  ready: number;
  available: number;
  unavailable: number;
}

/**
 * Kubernetes cluster operations.
 */
export interface K8sClient {
  /** Apply a set of manifests to the cluster. */
  apply(manifestPath: string, namespace: string): Promise<void>;

  /** Get the current state of a Deployment resource. */
  getDeployment(name: string, namespace: string): Promise<K8sDeployment>;

  /** Scale a deployment to the specified number of replicas. */
  scale(name: string, namespace: string, replicas: number): Promise<void>;

  /** Get all pods for a deployment. */
  getPods(name: string, namespace: string): Promise<K8sPod[]>;

  /** Get logs from a specific pod. */
  getPodLogs(podName: string, namespace: string, tailLines?: number): Promise<string>;
}

export interface K8sDeployment {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  image: string;
  status: 'available' | 'progressing' | 'unavailable';
}

export interface K8sPod {
  name: string;
  namespace: string;
  phase: 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Unknown';
  ready: boolean;
  restartCount: number;
  age: string;
}

/**
 * ArgoCD application operations.
 */
export interface ArgoClient {
  /** Trigger a sync for an ArgoCD application. */
  sync(appName: string, revision?: string): Promise<void>;

  /** Get the current sync status of an ArgoCD application. */
  getStatus(appName: string): Promise<ArgoAppStatus>;

  /** Roll back an ArgoCD application to a previous revision. */
  rollback(appName: string, revision: number): Promise<void>;
}

export interface ArgoAppStatus {
  name: string;
  syncStatus: 'Synced' | 'OutOfSync' | 'Unknown';
  healthStatus: 'Healthy' | 'Progressing' | 'Degraded' | 'Missing' | 'Unknown';
  revision: string;
  lastSyncAt: number;
}

/**
 * Manual approval gates for deployment pipelines.
 */
export interface ApprovalGate {
  /** Request approval for a deployment step. */
  request(step: string, details: ApprovalRequest): Promise<string>;

  /** Check the status of a pending approval. */
  check(approvalId: string): Promise<ApprovalStatus>;

  /** Override a denied or expired approval (requires elevated permissions). */
  override(approvalId: string, reason: string): Promise<void>;
}

export interface ApprovalRequest {
  service: string;
  environment: string;
  version: string;
  requester: string;
  reason: string;
  expiresInMs: number;
}

export interface ApprovalStatus {
  approvalId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'overridden';
  approver?: string;
  comment?: string;
  requestedAt: number;
  decidedAt?: number;
}
