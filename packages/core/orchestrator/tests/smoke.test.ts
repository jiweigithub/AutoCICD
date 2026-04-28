import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { OrchestrationModule } from '../src/orchestration.module.js';
import { OrchestratorService } from '../src/orchestrator.service.js';
import { TaskDecomposer } from '../src/decomposer/task-decomposer.js';

describe('OrchestrationModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [OrchestrationModule],
    }).compile();
    expect(module).toBeDefined();
  });

  it('should provide OrchestratorService', async () => {
    const module = await Test.createTestingModule({
      imports: [OrchestrationModule],
    }).compile();
    const service = module.get(OrchestratorService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(OrchestratorService);
  });
});

describe('TaskDecomposer', () => {
  const decomposer = new TaskDecomposer();

  it('should decompose a code-generation task', () => {
    const result = decomposer.decompose({
      taskId: 'test-1',
      title: 'Test Feature',
      description: 'implement a user login feature',
      domain: 'code-generation',
      priority: 'high',
      context: {},
      parentTaskId: null,
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
    expect(result.dag).toBeDefined();
    expect(result.dag!.specs.length).toBeGreaterThan(0);
  });

  it('should return error for empty description', () => {
    const result = decomposer.decompose({
      taskId: 'test-2',
      title: '',
      description: '',
      domain: 'code-generation',
      priority: 'low',
      context: {},
      parentTaskId: null,
      createdAt: new Date(),
    });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
