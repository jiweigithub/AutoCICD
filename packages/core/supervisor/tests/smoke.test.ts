import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { SupervisorModule } from '../src/supervisor.module.js';
import { SupervisorService } from '../src/supervisor.service.js';
import { DAGExecutor } from '../src/executor/dag-executor.js';

describe('SupervisorModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [SupervisorModule],
    }).compile();
    expect(module).toBeDefined();
  });

  it('should provide SupervisorService', async () => {
    const module = await Test.createTestingModule({
      imports: [SupervisorModule],
    }).compile();
    const service = module.get(SupervisorService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(SupervisorService);
  });
});

describe('DAGExecutor', () => {
  const executor = new DAGExecutor();

  it('should topologically sort a simple DAG', () => {
    const specs = [
      {
        specId: '1',
        parentTaskId: 'task-1',
        assignedAgent: 'code-generator',
        agentRole: 'executor',
        sequence: 0,
        dependencies: [],
        instructions: 'Step 1',
        estimatedDuration: 1000,
        status: 'pending',
        dependents: [],
        config: {},
      },
      {
        specId: '2',
        parentTaskId: 'task-1',
        assignedAgent: 'code-reviewer',
        agentRole: 'approver',
        sequence: 1,
        dependencies: ['1'],
        instructions: 'Step 2',
        estimatedDuration: 1000,
        status: 'pending',
        dependents: [],
        config: {},
      },
      {
        specId: '3',
        parentTaskId: 'task-1',
        assignedAgent: 'test-automator',
        agentRole: 'executor',
        sequence: 2,
        dependencies: ['1'],
        instructions: 'Step 3',
        estimatedDuration: 1000,
        status: 'pending',
        dependents: [],
        config: {},
      },
    ];

    const sorted = DAGExecutor.topologicalSort(specs as never);
    expect(sorted).toHaveLength(3);
    expect(sorted.indexOf('1')).toBeLessThan(sorted.indexOf('2'));
    expect(sorted.indexOf('1')).toBeLessThan(sorted.indexOf('3'));
  });
});
