import { describe, it, expect } from 'vitest';
import {
  GenerationTask, GeneratedFile, PullRequest, TDDState,
  FilePath,
  StartGenerationUseCase, TransitionTDDUseCase,
  BCCodeGenerationModule,
} from '../../src/index.js';

describe('BC-CG public API', () => {
  it('should export domain entities', () => {
    expect(GenerationTask).toBeDefined();
    expect(GeneratedFile).toBeDefined();
    expect(PullRequest).toBeDefined();
  });

  it('should export TDDState enum', () => {
    expect(TDDState.Red).toBe('red');
  });

  it('should export value objects', () => {
    expect(FilePath).toBeDefined();
  });

  it('should export use cases and module', () => {
    expect(StartGenerationUseCase).toBeDefined();
    expect(TransitionTDDUseCase).toBeDefined();
    expect(BCCodeGenerationModule).toBeDefined();
  });

  it('should create GenerationTask and transition TDD', () => {
    const task = new GenerationTask('g1', 'a1');
    expect(task.tddState).toBe(TDDState.Red);
    task.transitionTDD(TDDState.Green);
    expect(task.tddState).toBe(TDDState.Green);
  });

  it('should validate FilePath', () => {
    const fp = new FilePath('src/main.ts');
    expect(fp.extension).toBe('.ts');
    expect(() => new FilePath('../etc/passwd')).toThrow();
  });
});
