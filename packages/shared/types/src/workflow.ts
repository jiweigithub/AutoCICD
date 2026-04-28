export interface WorkflowNode {
  nodeId: string;
  nodeType: string;
  label: string;
  inputs: string[];
  outputs: string[];
  config: Record<string, unknown>;
}

export enum WorkflowNodeState {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Skipped = 'skipped',
}

export interface WorkflowDAG {
  dagId: string;
  workflowType: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: WorkflowDAGStatus;
}

export interface WorkflowEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  condition: string | null;
}

export enum WorkflowDAGStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
}
