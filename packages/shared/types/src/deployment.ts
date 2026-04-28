export interface Release {
  releaseId: string;
  version: Version;
  artifactUrl: string;
  checksum: string;
  releaseNotes: string;
  createdBy: string;
  createdAt: Date;
  status: ReleaseStatus;
}

export interface Version {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
  buildMetadata: string | null;
}

export enum ReleaseStatus {
  Draft = 'draft',
  Candidate = 'candidate',
  Approved = 'approved',
  Released = 'released',
  Superseded = 'superseded',
  RolledBack = 'rolled-back',
}

export interface RollbackPlan {
  planId: string;
  releaseId: string;
  targetVersion: Version;
  steps: RollbackStep[];
  estimatedDurationSeconds: number;
  autoRollback: boolean;
}

export interface RollbackStep {
  stepId: string;
  order: number;
  action: string;
  target: string;
  reversible: boolean;
}

export interface DeployResult {
  deployId: string;
  releaseId: string;
  environment: string;
  status: DeployStatus;
  startedAt: Date;
  completedAt: Date | null;
  deployedBy: string;
  artifacts: DeployArtifact[];
}

export interface DeployArtifact {
  name: string;
  version: string;
  checksum: string;
  sizeBytes: number;
}

export enum DeployStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Succeeded = 'succeeded',
  Failed = 'failed',
  RolledBack = 'rolled-back',
}
