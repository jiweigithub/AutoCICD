import type { ContractBrokenEvent } from '../../domain/events/index.js';

export class NatsTAEventPublisher {
  async publishContractBroken(_event: ContractBrokenEvent): Promise<void> { throw new Error('Not implemented: connect to NATS'); }
}
