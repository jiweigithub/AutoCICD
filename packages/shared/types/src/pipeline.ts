import type { Finding } from './review.js';

export enum PipelineStage {
  SPEC_PARSING = 'SPEC_PARSING',
  ARCHITECTURE_DESIGN = 'ARCHITECTURE_DESIGN',
  TDD_CODE_GEN = 'TDD_CODE_GEN',
  CODE_REVIEW = 'CODE_REVIEW',
  AUTOMATED_TESTING = 'AUTOMATED_TESTING',
  DEPLOYMENT = 'DEPLOYMENT',
}

export type PipelineRunStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ABANDONED';

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED';

export interface PipelineRun {
  pipelineId: string;
  specRef: { repo: string; commitSHA: string; filePath: string };
  status: PipelineRunStatus;
  currentStage: PipelineStage;
  stages: Record<PipelineStage, StageResult>;
  startedAt: string;
  completedAt: string | null;
  retryCount: number;
  triggeredBy: string;
}

export interface StageResult {
  stage: PipelineStage;
  status: StageStatus;
  startedAt: string;
  completedAt: string | null;
  artifactKeys: string[];
  findings?: Finding[];
  errorMessage: string | null;
  retryCount: number;
}
