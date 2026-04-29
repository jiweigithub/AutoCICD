import {
  PipelineStage,
  PIPELINE_STAGES,
  isTerminal,
  type PipelineRun,
} from './state-model.js';
import type { StageExecutor } from './stage-executor.js';

export class Pipeline {
  constructor(
    private readonly run: PipelineRun,
    private readonly executor: StageExecutor,
  ) {}

  getRun(): PipelineRun {
    return this.run;
  }

  async start(): Promise<PipelineRun> {
    this.run.status = 'IN_PROGRESS';

    const result = await this.executor.execute(PipelineStage.SPEC_PARSING, this.run.stages[PipelineStage.SPEC_PARSING]);
    this.run.stages[PipelineStage.SPEC_PARSING] = result;
    this.run.currentStage = PipelineStage.ARCHITECTURE_DESIGN;
    this.run.updatedAt = new Date();

    return this.run;
  }

  async advance(): Promise<PipelineRun> {
    if (isTerminal(this.run.status)) {
      return this.run;
    }

    const currentIndex = PIPELINE_STAGES.indexOf(this.run.currentStage);
    if (currentIndex === -1) {
      return this.run;
    }

    const stage = PIPELINE_STAGES[currentIndex]!;
    const result = await this.executor.execute(stage, this.run.stages[stage]);
    this.run.stages[stage] = result;
    this.run.updatedAt = new Date();

    const isLastStage = currentIndex === PIPELINE_STAGES.length - 1;
    if (isLastStage) {
      this.run.status = 'PASSED';
      this.run.completedAt = new Date();
    } else {
      const nextStage = PIPELINE_STAGES[currentIndex + 1]!;
      this.run.currentStage = nextStage;
    }

    return this.run;
  }

  fail(errorMessage: string): PipelineRun {
    const stage = this.run.stages[this.run.currentStage]!;
    stage.status = 'FAILED';
    stage.errorMessage = errorMessage;
    stage.completedAt = new Date();

    this.run.status = 'FAILED';
    this.run.completedAt = new Date();
    this.run.updatedAt = new Date();

    return this.run;
  }

  abandon(reason: string): PipelineRun {
    const stage = this.run.stages[this.run.currentStage]!;
    stage.errorMessage = reason;

    this.run.status = 'ABANDONED';
    this.run.completedAt = new Date();
    this.run.updatedAt = new Date();

    return this.run;
  }
}
