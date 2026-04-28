export interface Finding {
  findingId: string;
  reviewId: string;
  filePath: string;
  line: number;
  column: number;
  severity: Severity;
  checkType: CheckType;
  message: string;
  suggestion: string | null;
  createdAt: Date;
}

export interface ReviewSession {
  reviewId: string;
  workflowId: string;
  status: ReviewStatus;
  startedAt: Date;
  completedAt: Date | null;
  findings: Finding[];
  summary: ReviewSummary | null;
}

export interface ReviewSummary {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  passed: boolean;
}

export enum ReviewStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed',
}

export enum CheckType {
  StaticAnalysis = 'static-analysis',
  TypeCheck = 'type-check',
  Lint = 'lint',
  Security = 'security',
  Architecture = 'architecture',
  StyleGuide = 'style-guide',
  DependencyCheck = 'dependency-check',
}

export interface Violation {
  violationId: string;
  findingId: string;
  rule: string;
  severity: Severity;
  description: string;
  remediation: string;
}

export enum Severity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  Info = 'info',
}
