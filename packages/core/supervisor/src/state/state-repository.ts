import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import {
  sessionsTable,
  executionStatesTable,
  dagProgressTable,
} from './schema.js';

export interface SessionRow {
  id: string;
  dagId: string;
  agentType: string;
  agentRole: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  heartbeatAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionStateRow {
  id: string;
  dagId: string;
  specId: string;
  sessionId: string | null;
  status: string;
  attempt: number;
  maxRetries: number;
  result: unknown;
  error: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DAGProgressRow {
  id: string;
  dagId: string;
  totalSpecs: number;
  completedSpecs: number;
  failedSpecs: number;
  status: string;
  completed: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class StateRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async createSession(session: SessionRow): Promise<void> {
    await this.db.insert(sessionsTable).values(session);
  }

  async updateSessionStatus(id: string, status: string): Promise<void> {
    await this.db
      .update(sessionsTable)
      .set({
        status: sql`${status}`,
        updatedAt: sql`now()`,
      } as Record<string, unknown>)
      .where(eq(sessionsTable.id, id));
  }

  async updateHeartbeat(id: string): Promise<void> {
    await this.db
      .update(sessionsTable)
      .set({
        heartbeatAt: sql`now()`,
        updatedAt: sql`now()`,
      } as Record<string, unknown>)
      .where(eq(sessionsTable.id, id));
  }

  async findSessionById(id: string): Promise<SessionRow | null> {
    const rows = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findSessionsByDag(dagId: string): Promise<SessionRow[]> {
    return this.db.select().from(sessionsTable).where(eq(sessionsTable.dagId, dagId));
  }

  async createExecutionState(state: ExecutionStateRow): Promise<void> {
    await this.db.insert(executionStatesTable).values(state);
  }

  async updateExecutionState(
    id: string,
    update: Partial<Pick<ExecutionStateRow, 'status' | 'result' | 'error' | 'attempt' | 'startedAt' | 'completedAt'>>,
  ): Promise<void> {
    await this.db
      .update(executionStatesTable)
      .set({
        ...update,
        updatedAt: sql`now()`,
      } as Record<string, unknown>)
      .where(eq(executionStatesTable.id, id));
  }

  async findExecutionState(id: string): Promise<ExecutionStateRow | null> {
    const rows = await this.db
      .select()
      .from(executionStatesTable)
      .where(eq(executionStatesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findExecutionStatesByDag(dagId: string): Promise<ExecutionStateRow[]> {
    return this.db
      .select()
      .from(executionStatesTable)
      .where(eq(executionStatesTable.dagId, dagId));
  }

  async createDAGProgress(progress: DAGProgressRow): Promise<void> {
    await this.db.insert(dagProgressTable).values(progress);
  }

  async updateDAGProgress(
    dagId: string,
    update: Partial<Pick<DAGProgressRow, 'status' | 'completedSpecs' | 'failedSpecs' | 'completed' | 'completedAt'>>,
  ): Promise<void> {
    await this.db
      .update(dagProgressTable)
      .set({
        ...update,
        updatedAt: sql`now()`,
      } as Record<string, unknown>)
      .where(eq(dagProgressTable.dagId, dagId));
  }

  async findDAGProgress(dagId: string): Promise<DAGProgressRow | null> {
    const rows = await this.db
      .select()
      .from(dagProgressTable)
      .where(eq(dagProgressTable.dagId, dagId))
      .limit(1);
    return rows[0] ?? null;
  }
}
