export enum PipelineStage {
  SPEC_PARSING = 'spec-parsing',
  ARCHITECTURE_DESIGN = 'architecture-design',
  TDD_CODE_GEN = 'tdd-code-gen',
  CODE_REVIEW = 'code-review',
  AUTOMATED_TESTING = 'automated-testing',
  DEPLOYMENT = 'deployment',
}

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  PipelineStage.SPEC_PARSING,
  PipelineStage.ARCHITECTURE_DESIGN,
  PipelineStage.TDD_CODE_GEN,
  PipelineStage.CODE_REVIEW,
  PipelineStage.AUTOMATED_TESTING,
  PipelineStage.DEPLOYMENT,
] as const;

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED';

export type PipelineRunStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ABANDONED';

export interface StageResult {
  stage: PipelineStage;
  status: StageStatus;
  startedAt?: Date;
  completedAt?: Date;
  artifactKeys: string[];
  findings?: string[];
  errorMessage?: string;
  retryCount: number;
}

export interface PipelineRun {
  pipelineId: string;
  specRef: string;
  status: PipelineRunStatus;
  currentStage: PipelineStage;
  stages: Record<PipelineStage, StageResult>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export function createPipelineRun(specRef: string): PipelineRun {
  const now = new Date();
  const stages = {} as Record<PipelineStage, StageResult>;

  for (const stage of PIPELINE_STAGES) {
    stages[stage] = {
      stage,
      status: 'PENDING',
      artifactKeys: [],
      retryCount: 0,
    };
  }

  return {
    pipelineId: crypto.randomUUID(),
    specRef,
    status: 'PENDING',
    currentStage: PipelineStage.SPEC_PARSING,
    stages,
    createdAt: now,
    updatedAt: now,
  };
}

const TERMINAL_STATUSES: ReadonlySet<PipelineRunStatus> = new Set(['PASSED', 'FAILED', 'ABANDONED']);

export function isTerminal(status: PipelineRunStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
