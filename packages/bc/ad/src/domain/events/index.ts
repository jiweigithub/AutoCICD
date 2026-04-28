import type { DomainEvent } from '@ulw/shared-domain';
import { EventSubjects } from '@ulw/shared-types';

export { EventSubjects };

export interface ArchitectureApprovedEvent extends DomainEvent {
  eventType: typeof EventSubjects.Architecture.Approved;
  payload: {
    specId: string;
    storyId: string;
  };
}

export interface ArchitectureRejectedEvent extends DomainEvent {
  eventType: typeof EventSubjects.Architecture.Rejected;
  payload: {
    specId: string;
    storyId: string;
    reason: string;
  };
}

export interface ContractPublishedEvent extends DomainEvent {
  eventType: typeof EventSubjects.Architecture.ContractPublished;
  payload: {
    contractId: string;
    specId: string;
    version: string;
  };
}
