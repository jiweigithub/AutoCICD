export enum AgentType {
  ProductManager = 'product-manager',
  ArchitectureDesigner = 'architecture-designer',
  CodeGenerator = 'code-generator',
  CodeReviewer = 'code-reviewer',
  TestAutomator = 'test-automator',
  Deployer = 'deployer',
  Orchestrator = 'orchestrator',
  Supervisor = 'supervisor',
}

export enum AgentRole {
  Primary = 'primary',
  Observer = 'observer',
  Approver = 'approver',
  Executor = 'executor',
}

export interface AgentSession {
  sessionId: string;
  agentType: AgentType;
  agentRole: AgentRole;
  workflowId: string;
  startedAt: Date;
  completedAt: Date | null;
  status: AgentSessionStatus;
}

export enum AgentSessionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface AgentMessage {
  messageId: string;
  sessionId: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  payload: Record<string, unknown>;
  sentAt: Date;
  correlationId: string;
}
