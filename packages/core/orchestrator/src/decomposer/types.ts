import type { AgentType, AgentRole } from '@ulw/shared-types';

export interface TaskSpec {
  /** Unique identifier for the task specification */
  taskId: string;
  /** Human-readable title */
  title: string;
  /** Natural language description of the task */
  description: string;
  /** The domain this task belongs to */
  domain: TaskDomain;
  /** Priority level */
  priority: TaskPriority;
  /** Additional context as a flexible key-value map */
  context: Record<string, unknown>;
  /** If this task is part of a larger workflow */
  parentTaskId: string | null;
  /** Creation timestamp */
  createdAt: Date;
}

export enum TaskDomain {
  ProjectManagement = 'project-management',
  Architecture = 'architecture',
  CodeGeneration = 'code-generation',
  CodeReview = 'code-review',
  Testing = 'testing',
  Deployment = 'deployment',
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface MicroSpec {
  /** Unique identifier for this micro-spec */
  specId: string;
  /** The task that generated this micro-spec */
  parentTaskId: string;
  /** The agent type that should handle this micro-spec */
  assignedAgent: AgentType;
  /** The role the agent should take */
  agentRole: AgentRole;
  /** Ordered sequence number within the DAG */
  sequence: number;
  /** IDs of micro-specs that must complete before this one */
  dependencies: string[];
  /** Serialized instructions for the agent */
  instructions: string;
  /** Estimated effort in milliseconds */
  estimatedDuration: number;
  /** Current status */
  status: MicroSpecStatus;
  /** IDs of the micro-specs that depend on this one */
  dependents: string[];
  /** Configuration overrides for the agent */
  config: Record<string, unknown>;
}

export enum MicroSpecStatus {
  Pending = 'pending',
  Ready = 'ready',
  Dispatched = 'dispatched',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Skipped = 'skipped',
}

export interface MicroSpecDAG {
  /** Unique identifier for this DAG */
  dagId: string;
  /** The task this DAG was generated from */
  taskId: string;
  /** All micro-specs in the DAG */
  specs: MicroSpec[];
  /** Topologically sorted order of specIds */
  executionOrder: string[];
  /** The collaboration pattern this DAG follows */
  pattern: CollaborationPattern;
  /** DAG-level status */
  status: DAGStatus;
  /** When the DAG was created */
  createdAt: Date;
  /** When execution began */
  startedAt: Date | null;
  /** When execution finished */
  completedAt: Date | null;
}

export enum CollaborationPattern {
  HubAndSpoke = 'hub-and-spoke',
  DAG = 'dag',
  DreamTeam = 'dream-team',
}

export enum DAGStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Completed = 'completed',
  PartiallyFailed = 'partially-failed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface DecompositionResult {
  success: boolean;
  dag: MicroSpecDAG | null;
  errors: string[];
  warnings: string[];
}
