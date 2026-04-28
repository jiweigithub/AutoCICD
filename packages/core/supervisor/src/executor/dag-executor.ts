import { Injectable } from '@nestjs/common';
import type { MicroSpecDAG, MicroSpec, MicroSpecStatus } from '@ulw/orchestrator';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`DAGExecutor.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

export interface ExecutionResult {
  specId: string;
  success: boolean;
  output: Record<string, unknown>;
  error: string | null;
  durationMs: number;
}

export interface DAGExecutionReport {
  dagId: string;
  results: ExecutionResult[];
  completedCount: number;
  failedCount: number;
  totalCount: number;
  durationMs: number;
}

@Injectable()
export class DAGExecutor {
  executeDAG(dag: MicroSpecDAG): DAGExecutionReport {
    void dag;
    throw new NotImplementedError('executeDAG');
  }

  executeParallel(specs: MicroSpec[]): Promise<ExecutionResult[]> {
    void specs;
    throw new NotImplementedError('executeParallel');
  }

  resolveDependencies(
    spec: MicroSpec,
    completed: Set<string>,
  ): boolean {
    return spec.dependencies.every((dep) => completed.has(dep));
  }

  static topologicalSort(specs: MicroSpec[]): string[] {
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
        const adj = adjacency.get(depId) ?? [];
        adj.push(spec.specId);
        adjacency.set(depId, adj);
        inDegree.set(spec.specId, (inDegree.get(spec.specId) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);
      for (const neighbor of adjacency.get(node) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== specs.length) {
      throw new Error(`Cycle detected in DAG: ${sorted.length}/${specs.length} nodes sorted`);
    }

    return sorted;
  }

  updateSpecStatus(specs: MicroSpec[], specId: string, status: MicroSpecStatus): void {
    const spec = specs.find((s) => s.specId === specId);
    if (spec) spec.status = status;
  }
}
