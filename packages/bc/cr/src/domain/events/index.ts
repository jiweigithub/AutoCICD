import type { DomainEvent } from '@ulw/shared-domain';
import { EventSubjects } from '@ulw/shared-types';

export { EventSubjects };

export interface ReviewPassedEvent extends DomainEvent {
  eventType: typeof EventSubjects.CodeReview.Passed;
  payload: { sessionId: string; prId: string; totalFindings: number };
}

export interface ReviewFailedEvent extends DomainEvent {
  eventType: typeof EventSubjects.CodeReview.Failed;
  payload: { sessionId: string; prId: string; criticalCount: number; highCount: number };
}
