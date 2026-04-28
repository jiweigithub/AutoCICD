import type { MessageEnvelope } from '@ulw/shared-types';
import type { StoryCreatedEvent, StoryReadyEvent, SprintCommittedEvent } from '../../domain/events/index.js';

export interface PMEventPublisher {
  publishStoryCreated(event: StoryCreatedEvent): Promise<void>;
  publishStoryReady(event: StoryReadyEvent): Promise<void>;
  publishSprintCommitted(event: SprintCommittedEvent): Promise<void>;
}

export class NatsPMEventPublisher implements PMEventPublisher {
  async publishStoryCreated(_event: StoryCreatedEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }

  async publishStoryReady(_event: StoryReadyEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }

  async publishSprintCommitted(_event: SprintCommittedEvent): Promise<void> {
    throw new Error('Not implemented: connect to NATS');
  }
}
