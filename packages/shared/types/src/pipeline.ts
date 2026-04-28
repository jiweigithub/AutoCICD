export interface PipelineStage {
  stageId: string;
  pipelineId: string;
  name: string;
  stageType: StageType;
  order: number;
  config: Record<string, unknown>;
  dependsOn: string[];
}

export enum StageType {
  Build = 'build',
  Test = 'test',
  Lint = 'lint',
  Scan = 'scan',
  Package = 'package',
  Deploy = 'deploy',
  Verify = 'verify',
  Notify = 'notify',
}

export interface ApprovalGate {
  gateId: string;
  stageId: string;
  requiredApprovers: string[];
  approvedBy: string[];
  status: ApprovalGateStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
}

export enum ApprovalGateStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Expired = 'expired',
}

export interface CanaryRule {
  ruleId: string;
  metric: string;
  threshold: number;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  durationSeconds: number;
  enabled: boolean;
}
