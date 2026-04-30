import { describe, it, expect } from 'vitest';
import {
  PipelineStage,
  type StageResult,
} from '../src/state-model.js';
import { executeStage } from '../src/stage-executor.js';

function pendingResult(stage: PipelineStage): StageResult {
  return {
    stage,
    status: 'PENDING',
    artifactKeys: [],
    retryCount: 0,
  };
}

describe('executeStage', () => {
  it('transitions PENDING -> IN_PROGRESS -> PASSED on successful execution', async () => {
    const result = await executeStage(PipelineStage.SPEC_PARSING);

    expect(result.stage).toBe(PipelineStage.SPEC_PARSING);
    expect(result.status).toBe('PASSED');
    expect(result.startedAt).toBeInstanceOf(Date);
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(result.artifactKeys.length).toBeGreaterThanOrEqual(0);
  });

  it('sets startedAt before execution and completedAt after', async () => {
    const result = await executeStage(PipelineStage.CODE_REVIEW);

    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(result.completedAt!.getTime()).toBeGreaterThanOrEqual(result.startedAt!.getTime());
  });

  it('skips execution when prevStageResult is SKIPPED', async () => {
    const prev: StageResult = {
      stage: PipelineStage.SPEC_PARSING,
      status: 'SKIPPED',
      artifactKeys: [],
      retryCount: 0,
    };

    const result = await executeStage(PipelineStage.ARCHITECTURE_DESIGN, prev);

    expect(result.status).toBe('SKIPPED');
    expect(result.artifactKeys).toEqual([]);
    expect(result.retryCount).toBe(0);
  });

  it('skips execution when prevStageResult is FAILED', async () => {
    const prev: StageResult = {
      stage: PipelineStage.ARCHITECTURE_DESIGN,
      status: 'FAILED',
      artifactKeys: [],
      retryCount: 0,
      errorMessage: 'architecture design failed',
    };

    const result = await executeStage(PipelineStage.TDD_CODE_GEN, prev);

    expect(result.status).toBe('SKIPPED');
  });

  it('does NOT skip when prevStageResult is PENDING', async () => {
    const prev = pendingResult(PipelineStage.SPEC_PARSING);

    const result = await executeStage(PipelineStage.ARCHITECTURE_DESIGN, prev);

    expect(result.status).not.toBe('SKIPPED');
  });

  it('does NOT skip when prevStageResult is PASSED', async () => {
    const prev: StageResult = {
      stage: PipelineStage.SPEC_PARSING,
      status: 'PASSED',
      artifactKeys: ['spec-v1'],
      retryCount: 0,
    };

    const result = await executeStage(PipelineStage.ARCHITECTURE_DESIGN, prev);

    expect(result.status).not.toBe('SKIPPED');
  });

  it('does NOT skip when prevStageResult is IN_PROGRESS', async () => {
    const prev: StageResult = {
      stage: PipelineStage.SPEC_PARSING,
      status: 'IN_PROGRESS',
      artifactKeys: [],
      retryCount: 0,
    };

    const result = await executeStage(PipelineStage.ARCHITECTURE_DESIGN, prev);

    expect(result.status).not.toBe('SKIPPED');
  });

  it('executes without prevStageResult (first stage)', async () => {
    const result = await executeStage(PipelineStage.SPEC_PARSING);

    expect(result.status).toBe('PASSED');
    expect(result.stage).toBe(PipelineStage.SPEC_PARSING);
  });

  it('works for all 6 pipeline stages', async () => {
    for (const stage of [PipelineStage.SPEC_PARSING, PipelineStage.ARCHITECTURE_DESIGN, PipelineStage.TDD_CODE_GEN, PipelineStage.CODE_REVIEW, PipelineStage.AUTOMATED_TESTING, PipelineStage.DEPLOYMENT]) {
      const result = await executeStage(stage);
      expect(result.status).toBe('PASSED');
      expect(result.stage).toBe(stage);
    }
  });
});
