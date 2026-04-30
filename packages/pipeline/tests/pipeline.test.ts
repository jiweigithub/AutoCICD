import { describe, it, expect, beforeEach } from 'vitest';
import {
  PipelineStage,
  PIPELINE_STAGES,
  createPipelineRun,
  type PipelineRun,
  type StageResult,
} from '../src/state-model.js';
import { type StageExecutor } from '../src/stage-executor.js';
import { Pipeline } from '../src/pipeline.js';

const passingExecutor: StageExecutor = {
  async execute(stage: PipelineStage): Promise<StageResult> {
    return {
      stage,
      status: 'PASSED',
      artifactKeys: [`artifact-${stage}`],
      retryCount: 0,
      startedAt: new Date(),
      completedAt: new Date(),
    };
  },
  getStatus(_stage: PipelineStage) {
    return 'PENDING';
  },
  cancel(_stage: PipelineStage) {},
};

describe('Pipeline', () => {
  let pipeline: Pipeline;
  let run: PipelineRun;

  beforeEach(() => {
    run = createPipelineRun('spec://test/1');
    pipeline = new Pipeline(run, passingExecutor);
  });

  describe('getRun', () => {
    it('returns the current pipeline run', () => {
      const current = pipeline.getRun();
      expect(current.pipelineId).toBe(run.pipelineId);
      expect(current.status).toBe('PENDING');
    });
  });

  describe('start', () => {
    it('sets run status to IN_PROGRESS', async () => {
      const result = await pipeline.start();
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('executes the first stage (SPEC_PARSING) and sets it to PASSED', async () => {
      const result = await pipeline.start();
      expect(result.stages[PipelineStage.SPEC_PARSING]!.status).toBe('PASSED');
    });

    it('sets currentStage to ARCHITECTURE_DESIGN after first stage completes', async () => {
      const result = await pipeline.start();
      expect(result.currentStage).toBe(PipelineStage.ARCHITECTURE_DESIGN);
    });

    it('updates timestamps on the run', async () => {
      const result = await pipeline.start();
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(run.updatedAt.getTime());
    });
  });

  describe('advance', () => {
    it('advances to the next stage on each call', async () => {
      await pipeline.start();

      const result1 = await pipeline.advance();
      expect(result1.currentStage).toBe(PipelineStage.TDD_CODE_GEN);
      expect(result1.stages[PipelineStage.ARCHITECTURE_DESIGN]!.status).toBe('PASSED');

      const result2 = await pipeline.advance();
      expect(result2.currentStage).toBe(PipelineStage.CODE_REVIEW);
      expect(result2.stages[PipelineStage.TDD_CODE_GEN]!.status).toBe('PASSED');
    });

    it('sets status to PASSED after the last stage completes', async () => {
      await pipeline.start();
      for (let i = 1; i < PIPELINE_STAGES.length; i++) {
        await pipeline.advance();
      }

      const result = pipeline.getRun();
      expect(result.status).toBe('PASSED');
      for (const stage of PIPELINE_STAGES) {
        expect(result.stages[stage]!.status).toBe('PASSED');
      }
    });

    it('sets completedAt when pipeline finishes', async () => {
      await pipeline.start();
      for (let i = 1; i < PIPELINE_STAGES.length; i++) {
        await pipeline.advance();
      }

      const result = pipeline.getRun();
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('does nothing when pipeline already in terminal state', async () => {
      await pipeline.start();
      for (let i = 1; i < PIPELINE_STAGES.length; i++) {
        await pipeline.advance();
      }

      const before = pipeline.getRun();
      const after = await pipeline.advance();
      expect(after.status).toBe(before.status);
      expect(after.currentStage).toBe(before.currentStage);
    });
  });

  describe('fail', () => {
    it('marks current stage as FAILED and run as FAILED', async () => {
      await pipeline.start();

      const result = pipeline.fail('architecture review failed');
      expect(result.status).toBe('FAILED');
      expect(result.stages[PipelineStage.ARCHITECTURE_DESIGN]!.status).toBe('FAILED');
      expect(result.stages[PipelineStage.ARCHITECTURE_DESIGN]!.errorMessage).toBe('architecture review failed');
    });

    it('sets completedAt on failure', () => {
      const result = pipeline.fail('critical error');
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('does not affect already-passed stages', async () => {
      await pipeline.start();

      const result = pipeline.fail('stage 2 failed');
      expect(result.stages[PipelineStage.SPEC_PARSING]!.status).toBe('PASSED');
    });
  });

  describe('abandon', () => {
    it('sets run status to ABANDONED', () => {
      const result = pipeline.abandon('user cancelled');
      expect(result.status).toBe('ABANDONED');
    });

    it('records the reason in the current stage', () => {
      const result = pipeline.abandon('deployment cancelled');
      expect(result.stages[PipelineStage.SPEC_PARSING]!.errorMessage).toBe('deployment cancelled');
    });

    it('sets completedAt', () => {
      const result = pipeline.abandon('cancelled');
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('end-to-end happy path', () => {
    it('completes all 6 stages successfully', async () => {
      await pipeline.start();

      for (let i = 1; i < PIPELINE_STAGES.length; i++) {
        const result = await pipeline.advance();
        if (i < PIPELINE_STAGES.length - 1) {
          expect(result.status).toBe('IN_PROGRESS');
        }
      }

      const final = pipeline.getRun();
      expect(final.status).toBe('PASSED');
      expect(final.completedAt).toBeDefined();

      const allPassed = PIPELINE_STAGES.every(
        (s) => final.stages[s]!.status === 'PASSED',
      );
      expect(allPassed).toBe(true);
    });

    it('correctly sequences through the SDD+TDD pipeline stages', async () => {
      await pipeline.start();

      const expectedOrder = [
        PipelineStage.ARCHITECTURE_DESIGN,
        PipelineStage.TDD_CODE_GEN,
        PipelineStage.CODE_REVIEW,
        PipelineStage.AUTOMATED_TESTING,
        PipelineStage.DEPLOYMENT,
      ];

      for (const expectedStage of expectedOrder) {
        expect(pipeline.getRun().currentStage).toBe(expectedStage);
        await pipeline.advance();
      }

      const final = pipeline.getRun();
      expect(final.status).toBe('PASSED');
    });
  });
});
