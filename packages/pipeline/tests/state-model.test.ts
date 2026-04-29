import { describe, it, expect } from 'vitest';
import {
  PipelineStage,
  PIPELINE_STAGES,
  createPipelineRun,
  isTerminal,
  type StageStatus,
  type PipelineRunStatus,
  type StageResult,
} from '../src/state-model.js';

describe('PipelineStage enum', () => {
  it('has exactly 6 stages', () => {
    expect(PIPELINE_STAGES).toHaveLength(6);
  });

  it('stages are in the correct SDD+TDD order', () => {
    expect(PIPELINE_STAGES[0]).toBe(PipelineStage.SPEC_PARSING);
    expect(PIPELINE_STAGES[1]).toBe(PipelineStage.ARCHITECTURE_DESIGN);
    expect(PIPELINE_STAGES[2]).toBe(PipelineStage.TDD_CODE_GEN);
    expect(PIPELINE_STAGES[3]).toBe(PipelineStage.CODE_REVIEW);
    expect(PIPELINE_STAGES[4]).toBe(PipelineStage.AUTOMATED_TESTING);
    expect(PIPELINE_STAGES[5]).toBe(PipelineStage.DEPLOYMENT);
  });
});

describe('createPipelineRun', () => {
  it('creates a run with the given specRef', () => {
    const run = createPipelineRun('spec://project/123');
    expect(run.specRef).toBe('spec://project/123');
  });

  it('generates a unique pipelineId', () => {
    const run1 = createPipelineRun('spec://project/1');
    const run2 = createPipelineRun('spec://project/2');
    expect(run1.pipelineId).toBeTruthy();
    expect(run2.pipelineId).toBeTruthy();
    expect(run1.pipelineId).not.toBe(run2.pipelineId);
  });

  it('initializes status to PENDING', () => {
    const run = createPipelineRun('spec://project/123');
    expect(run.status).toBe('PENDING');
  });

  it('initializes currentStage to the first stage (SPEC_PARSING)', () => {
    const run = createPipelineRun('spec://project/123');
    expect(run.currentStage).toBe(PipelineStage.SPEC_PARSING);
  });

  it('initializes all 6 stages to PENDING with retryCount=0 and empty artifactKeys', () => {
    const run = createPipelineRun('spec://project/123');

    for (const stage of PIPELINE_STAGES) {
      const result = run.stages[stage] as StageResult;
      expect(result.stage).toBe(stage);
      expect(result.status).toBe('PENDING');
      expect(result.retryCount).toBe(0);
      expect(result.artifactKeys).toEqual([]);
      expect(result.startedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.findings).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    }
  });

  it('sets createdAt and updatedAt to the current time', () => {
    const before = new Date();
    const run = createPipelineRun('spec://project/123');
    const after = new Date();

    expect(run.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(run.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(run.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(run.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('does not have completedAt set', () => {
    const run = createPipelineRun('spec://project/123');
    expect(run.completedAt).toBeUndefined();
  });
});

describe('isTerminal', () => {
  it('returns true for PASSED', () => {
    expect(isTerminal('PASSED')).toBe(true);
  });

  it('returns true for FAILED', () => {
    expect(isTerminal('FAILED')).toBe(true);
  });

  it('returns true for ABANDONED', () => {
    expect(isTerminal('ABANDONED')).toBe(true);
  });

  it('returns false for PENDING', () => {
    expect(isTerminal('PENDING')).toBe(false);
  });

  it('returns false for IN_PROGRESS', () => {
    expect(isTerminal('IN_PROGRESS')).toBe(false);
  });
});

describe('StageStatus type safety', () => {
  it('accepts valid status values', () => {
    const statuses: StageStatus[] = ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'SKIPPED'];
    expect(statuses).toHaveLength(5);
  });
});

describe('PipelineRunStatus type safety', () => {
  it('accepts valid run status values', () => {
    const statuses: PipelineRunStatus[] = ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'ABANDONED'];
    expect(statuses).toHaveLength(5);
  });
});
