export interface DeploymentOrchestrator {
  deploy(releaseId: string): Promise<void>;
  rollback(releaseId: string, reason: string): Promise<string>;
}
