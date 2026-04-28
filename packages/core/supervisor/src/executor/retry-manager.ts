import { Injectable } from '@nestjs/common';

export interface RetryTask {
  specId: string;
  dagId: string;
  attempt: number;
  maxRetries: number;
  lastError: string | null;
  nextRetryAt: Date | null;
}

@Injectable()
export class RetryManager {
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;
  private readonly maxJitterMs = 500;
  private readonly dlq = new Map<string, RetryTask>();

  shouldRetry(attempt: number, error: string): boolean {
    void error;
    return attempt < this.maxRetries;
  }

  computeBackoff(attempt: number): number {
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * this.maxJitterMs);
    return exponentialDelay + jitter;
  }

  scheduleRetry(task: RetryTask): void {
    const delay = this.computeBackoff(task.attempt);
    task.nextRetryAt = new Date(Date.now() + delay);
  }

  sendToDLQ(task: RetryTask): void {
    this.dlq.set(task.specId, task);
  }

  getDLQTasks(): RetryTask[] {
    return [...this.dlq.values()];
  }

  getDLQTask(specId: string): RetryTask | null {
    return this.dlq.get(specId) ?? null;
  }

  acknowledgeDLQ(specId: string): boolean {
    return this.dlq.delete(specId);
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }
}
