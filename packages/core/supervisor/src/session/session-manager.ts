import { Injectable } from '@nestjs/common';

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`SessionManager.${method} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

export interface AgentSessionContext {
  sessionId: string;
  dagId: string;
  agentType: string;
  agentRole: string;
  status: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class SessionManager {
  private readonly activeSessions = new Map<string, AgentSessionContext>();

  createSession(
    dagId: string,
    agentType: string,
    agentRole: string,
  ): AgentSessionContext {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const session: AgentSessionContext = {
      sessionId,
      dagId,
      agentType,
      agentRole,
      status: 'pending',
      metadata: {},
    };
    this.activeSessions.set(sessionId, session);
    return session;
  }

  persistSession(sessionId: string): AgentSessionContext | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    throw new NotImplementedError('persistSession');
  }

  restoreSession(sessionId: string): AgentSessionContext | null {
    throw new NotImplementedError('restoreSession');
  }

  getActiveSession(sessionId: string): AgentSessionContext | null {
    return this.activeSessions.get(sessionId) ?? null;
  }

  listActiveSessionsByDag(dagId: string): AgentSessionContext[] {
    return [...this.activeSessions.values()].filter((s) => s.dagId === dagId);
  }

  updateSessionStatus(sessionId: string, status: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    session.status = status;
    return true;
  }

  removeSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }
}
