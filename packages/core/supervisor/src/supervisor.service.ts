import { Injectable } from '@nestjs/common';
import { DAGExecutor } from './executor/dag-executor.js';
import type { DAGExecutionReport } from './executor/dag-executor.js';
import { RetryManager } from './executor/retry-manager.js';
import { SessionManager } from './session/session-manager.js';
import { HeartbeatMonitor } from './session/heartbeat-monitor.js';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`SupervisorService.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

export interface DAGProgress {
  dagId: string;
  totalSpecs: number;
  completedSpecs: number;
  failedSpecs: number;
  status: string;
  completed: boolean;
}

export interface DAGResults {
  dagId: string;
  status: string;
  results: Array<{
    specId: string;
    success: boolean;
    output: Record<string, unknown>;
    error: string | null;
  }>;
}

@Injectable()
export class SupervisorService {
  private readonly dagProgress = new Map<string, DAGProgress>();
  private readonly dagResults = new Map<string, DAGResults>();

  constructor(
    private readonly dagExecutor: DAGExecutor,
    private readonly retryManager: RetryManager,
    private readonly sessionManager: SessionManager,
    private readonly heartbeatMonitor: HeartbeatMonitor,
  ) {}

  executeDAG(input: {
    dagId: string;
    specs: Array<{
      specId: string;
      assignedAgent: string;
      instructions: string;
      dependencies: string[];
    }>;
  }): DAGExecutionReport {
    this.dagProgress.set(input.dagId, {
      dagId: input.dagId,
      totalSpecs: input.specs.length,
      completedSpecs: 0,
      failedSpecs: 0,
      status: 'running',
      completed: false,
    });

    for (const spec of input.specs) {
      this.sessionManager.createSession(input.dagId, spec.assignedAgent, 'executor');
    }

    this.heartbeatMonitor.start();

    throw new NotImplementedError('executeDAG');
  }

  trackProgress(dagId: string): DAGProgress | null {
    return this.dagProgress.get(dagId) ?? null;
  }

  aggregateResults(dagId: string): DAGResults | null {
    return this.dagResults.get(dagId) ?? null;
  }
}
