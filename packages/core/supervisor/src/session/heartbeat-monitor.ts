import { Injectable } from '@nestjs/common';

const HEARTBEAT_TIMEOUT_MS = 60_000;
const HEARTBEAT_CHECK_INTERVAL_MS = 10_000;

export interface AgentHeartbeat {
  sessionId: string;
  agentType: string;
  lastHeartbeat: Date;
  status: 'alive' | 'stale' | 'dead';
}

@Injectable()
export class HeartbeatMonitor {
  private readonly heartbeats = new Map<string, AgentHeartbeat>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  registerAgent(sessionId: string, agentType: string): void {
    this.heartbeats.set(sessionId, {
      sessionId,
      agentType,
      lastHeartbeat: new Date(),
      status: 'alive',
    });
  }

  recordHeartbeat(sessionId: string): boolean {
    const entry = this.heartbeats.get(sessionId);
    if (!entry) return false;
    entry.lastHeartbeat = new Date();
    entry.status = 'alive';
    return true;
  }

  getStaleAgents(): AgentHeartbeat[] {
    const now = Date.now();
    return [...this.heartbeats.values()].filter(
      (h) => h.status !== 'dead' && now - h.lastHeartbeat.getTime() > HEARTBEAT_TIMEOUT_MS,
    );
  }

  check(): void {
    const stale = this.getStaleAgents();
    for (const entry of stale) {
      const timeSince = Date.now() - entry.lastHeartbeat.getTime();
      if (timeSince > HEARTBEAT_TIMEOUT_MS * 3) {
        entry.status = 'dead';
      } else {
        entry.status = 'stale';
      }
    }
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.check(), HEARTBEAT_CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  removeAgent(sessionId: string): boolean {
    return this.heartbeats.delete(sessionId);
  }
}
