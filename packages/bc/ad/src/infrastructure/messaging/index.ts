import type { ArchitectureApprovedEvent, ArchitectureRejectedEvent, ContractPublishedEvent } from '../../domain/events/index.js';

export class NatsADEventPublisher {
  async publishArchitectureApproved(_event: ArchitectureApprovedEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }
  async publishArchitectureRejected(_event: ArchitectureRejectedEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }
  async publishContractPublished(_event: ContractPublishedEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }
}
