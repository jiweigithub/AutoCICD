import type { AgentType, AgentRole } from '@ulw/shared-types';
import type {
  TaskSpec,
  MicroSpec,
  MicroSpecDAG,
  DecompositionResult,
  CollaborationPattern,
  DAGStatus,
  MicroSpecStatus,
} from './types.js';

export class TaskDecomposer {
  /**
   * Decompose a TaskSpec into a directed acyclic graph of MicroSpecs.
   * Each MicroSpec maps to a specific agent type with role and dependencies.
   */
  decompose(spec: TaskSpec): DecompositionResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!spec.taskId) {
      errors.push('TaskSpec is missing taskId');
      return { success: false, dag: null, errors, warnings };
    }

    if (!spec.description || spec.description.trim().length === 0) {
      errors.push('TaskSpec has no description');
      return { success: false, dag: null, errors, warnings };
    }

    const pattern = this.selectPattern(spec);
    const microSpecs = this.generateMicroSpecs(spec, pattern);
    const executionOrder = this.topologicalSort(microSpecs);

    if (executionOrder.length === 0) {
      warnings.push('No micro-specs generated — task may be too simple to decompose');
    }

    const dag: MicroSpecDAG = {
      dagId: `dag-${spec.taskId}`,
      taskId: spec.taskId,
      specs: microSpecs,
      executionOrder,
      pattern,
      status: 'pending' as DAGStatus,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    };

    return { success: true, dag, errors, warnings };
  }

  private selectPattern(spec: TaskSpec): CollaborationPattern {
    const description = spec.description.toLowerCase();
    if (description.includes('dream-team') || description.includes('collaborative')) {
      return 'dream-team' as CollaborationPattern;
    }
    if (description.includes('sequential') || description.includes('linear') || description.includes('pipeline')) {
      return 'dag' as CollaborationPattern;
    }
    return 'hub-and-spoke' as CollaborationPattern;
  }

  private generateMicroSpecs(spec: TaskSpec, pattern: CollaborationPattern): MicroSpec[] {
    const specs: MicroSpec[] = [];

    switch (spec.domain) {
      case 'project-management':
        specs.push(...this.pmSpecs(spec.taskId, pattern));
        break;
      case 'architecture':
        specs.push(...this.architectureSpecs(spec.taskId, pattern));
        break;
      case 'code-generation':
        specs.push(...this.codeGenSpecs(spec.taskId, pattern));
        break;
      case 'code-review':
        specs.push(...this.codeReviewSpecs(spec.taskId, pattern));
        break;
      case 'testing':
        specs.push(...this.testingSpecs(spec.taskId, pattern));
        break;
      case 'deployment':
        specs.push(...this.deploymentSpecs(spec.taskId, pattern));
        break;
      default:
        specs.push(this.genericSpec(spec.taskId, 0));
    }

    return specs;
  }

  private pmSpecs(taskId: string, _pattern: CollaborationPattern): MicroSpec[] {
    return [
      this.createSpec(taskId, 0, 'product-manager' as AgentType, 'primary' as AgentRole, [], 'Analyze and refine task requirements'),
    ];
  }

  private architectureSpecs(taskId: string, _pattern: CollaborationPattern): MicroSpec[] {
    return [
      this.createSpec(taskId, 0, 'architecture-designer' as AgentType, 'primary' as AgentRole, [], 'Design system architecture based on requirements'),
    ];
  }

  private codeGenSpecs(taskId: string, pattern: CollaborationPattern): MicroSpec[] {
    if (pattern === 'dream-team') {
      return [
        this.createSpec(taskId, 0, 'architecture-designer' as AgentType, 'observer' as AgentRole, [], 'Provide architectural guidance'),
        this.createSpec(taskId, 1, 'code-generator' as AgentType, 'executor' as AgentRole, ['spec-0'], 'Generate code implementation'),
        this.createSpec(taskId, 2, 'code-reviewer' as AgentType, 'approver' as AgentRole, ['spec-1'], 'Review generated code'),
        this.createSpec(taskId, 3, 'test-automator' as AgentType, 'executor' as AgentRole, ['spec-1'], 'Write and run tests'),
      ];
    }

    if (pattern === 'dag') {
      return [
        this.createSpec(taskId, 0, 'code-generator' as AgentType, 'executor' as AgentRole, [], 'Write code'),
        this.createSpec(taskId, 1, 'code-reviewer' as AgentType, 'approver' as AgentRole, ['spec-0'], 'Review code'),
        this.createSpec(taskId, 2, 'test-automator' as AgentType, 'executor' as AgentRole, ['spec-1'], 'Run tests'),
      ];
    }

    return [
      this.createSpec(taskId, 0, 'code-generator' as AgentType, 'primary' as AgentRole, [], 'Implement code changes'),
    ];
  }

  private codeReviewSpecs(taskId: string, _pattern: CollaborationPattern): MicroSpec[] {
    return [
      this.createSpec(taskId, 0, 'code-reviewer' as AgentType, 'primary' as AgentRole, [], 'Review code for quality and correctness'),
    ];
  }

  private testingSpecs(taskId: string, _pattern: CollaborationPattern): MicroSpec[] {
    return [
      this.createSpec(taskId, 0, 'test-automator' as AgentType, 'primary' as AgentRole, [], 'Execute test suite'),
      this.createSpec(taskId, 1, 'code-reviewer' as AgentType, 'observer' as AgentRole, [], 'Validate test results'),
    ];
  }

  private deploymentSpecs(taskId: string, _pattern: CollaborationPattern): MicroSpec[] {
    return [
      this.createSpec(taskId, 0, 'deployer' as AgentType, 'executor' as AgentRole, [], 'Prepare deployment artifacts'),
      this.createSpec(taskId, 1, 'deployer' as AgentType, 'executor' as AgentRole, ['spec-0'], 'Deploy to staging'),
      this.createSpec(taskId, 2, 'deployer' as AgentType, 'executor' as AgentRole, ['spec-1'], 'Deploy to production'),
      this.createSpec(taskId, 3, 'test-automator' as AgentType, 'approver' as AgentRole, ['spec-1'], 'Run smoke tests on staging'),
    ];
  }

  private genericSpec(taskId: string, sequence: number): MicroSpec {
    return this.createSpec(taskId, sequence, 'code-generator' as AgentType, 'executor' as AgentRole, [], 'Execute generic task');
  }

  private createSpec(
    taskId: string,
    sequence: number,
    agentType: AgentType,
    agentRole: AgentRole,
    dependencies: string[],
    instructions: string,
  ): MicroSpec {
    const specId = `spec-${sequence}`;
    return {
      specId,
      parentTaskId: taskId,
      assignedAgent: agentType,
      agentRole,
      sequence,
      dependencies,
      instructions,
      estimatedDuration: 30000,
      status: 'pending' as MicroSpecStatus,
      dependents: [],
      config: {},
    };
  }

  private topologicalSort(specs: MicroSpec[]): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    const specIds = new Set(specs.map((s) => s.specId));

    for (const spec of specs) {
      inDegree.set(spec.specId, 0);
      adjacency.set(spec.specId, []);
    }

    for (const spec of specs) {
      for (const depId of spec.dependencies) {
        if (!specIds.has(depId)) continue;
        inDegree.set(spec.specId, (inDegree.get(spec.specId) ?? 0) + 1);
        const adj = adjacency.get(depId) ?? [];
        adj.push(spec.specId);
        adjacency.set(depId, adj);
      }
    }

    const queue: string[] = [];
    for (const [specId, degree] of inDegree) {
      if (degree === 0) queue.push(specId);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);
      const neighbors = adjacency.get(node) ?? [];
      for (const neighbor of neighbors) {
        const newInDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newInDegree);
        if (newInDegree === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== specs.length) {
      throw new Error(`Cycle detected in micro-spec DAG for task. Sorted ${sorted.length} of ${specs.length} nodes.`);
    }

    return sorted;
  }
}
