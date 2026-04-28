import type { ReviewPassedEvent, ReviewFailedEvent } from '../../domain/events/index.js';

export class NatsCREventPublisher {
  async publishReviewPassed(_event: ReviewPassedEvent): Promise<void> { throw new Error('Not implemented: connect to NATS'); }
  async publishReviewFailed(_event: ReviewFailedEvent): Promise<void> { throw new Error('Not implemented: connect to NATS'); }
}
