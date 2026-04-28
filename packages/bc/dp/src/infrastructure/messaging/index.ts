import type { DeployedEvent, RollbackTriggeredEvent } from '../../domain/events/index.js';

export class NatsDPEventPublisher {
  async publishDeployed(_event: DeployedEvent): Promise<void> { throw new Error('Not implemented: connect to NATS'); }
  async publishRollbackTriggered(_event: RollbackTriggeredEvent): Promise<void> { throw new Error('Not implemented: connect to NATS'); }
}
