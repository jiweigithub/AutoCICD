import { Injectable } from '@nestjs/common';
import type { TaskSpec, DecompositionResult } from './decomposer/types.js';
import { TaskDecomposer } from './decomposer/task-decomposer.js';
import { NaturalLanguageIntentParser } from './decomposer/intent-parser.js';
import { DomainBasedAgentRouter } from './router/agent-router.js';
import { PatternSelector } from './router/pattern-selector.js';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`OrchestratorService.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

@Injectable()
export class OrchestratorService {
  private readonly decomposer = new TaskDecomposer();
  private readonly intentParser = new NaturalLanguageIntentParser();
  private readonly agentRouter = new DomainBasedAgentRouter();
  private readonly patternSelector = new PatternSelector();
  private readonly tasks = new Map<string, DecompositionResult>();

  decomposeTask(taskSpec: TaskSpec): DecompositionResult {
    const parsedSpec = this.intentParser.parse(taskSpec.description);
    const spec = parsedSpec ?? taskSpec;
    const result = this.decomposer.decompose(spec);
    this.tasks.set(taskSpec.taskId, result);
    return result;
  }

  routeToSupervisor(taskId: string): DecompositionResult | null {
    const result = this.tasks.get(taskId);
    if (!result || !result.dag) return null;

    const agent = this.agentRouter.resolveSteward(result.dag.specs[0]?.parentTaskId
      ? (result.dag.specs[0]?.instructions as never) ?? ('code-generation' as never)
      : ('code-generation' as never));

    void agent;
    throw new NotImplementedError('routeToSupervisor');
  }

  getPattern(taskId: string): string | null {
    const result = this.tasks.get(taskId);
    if (!result || !result.dag) return null;
    return result.dag.pattern;
  }
}
