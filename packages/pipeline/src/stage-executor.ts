import {
  PipelineStage,
  type StageResult,
  type StageStatus,
} from './state-model.js';

export interface StageExecutor {
  execute(stage: PipelineStage, input: StageResult): Promise<StageResult>;
  getStatus(stage: PipelineStage): StageStatus;
  cancel(stage: PipelineStage): void;
}

export async function executeStage(
  stage: PipelineStage,
  prevStageResult?: StageResult,
): Promise<StageResult> {
  if (prevStageResult !== undefined) {
    if (prevStageResult.status === 'SKIPPED' || prevStageResult.status === 'FAILED') {
      return {
        stage,
        status: 'SKIPPED',
        artifactKeys: [],
        retryCount: 0,
      };
    }
  }

  const startedAt = new Date();
  const completedAt = new Date();

  return {
    stage,
    status: 'PASSED',
    startedAt,
    completedAt,
    artifactKeys: [],
    retryCount: 0,
  };
}
