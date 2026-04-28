import type { CodeReadyEvent } from '../../domain/events/index.js';

export class NatsCGEventPublisher {
  async publishCodeReady(_event: CodeReadyEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }
}
