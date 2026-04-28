import type { DomainEvent } from '@ulw/shared-domain';
import { EventSubjects } from '@ulw/shared-types';

export { EventSubjects };

export interface TDDTransitionEvent extends DomainEvent {
  eventType: typeof EventSubjects.CodeGeneration.TDDTransition;
  payload: { taskId: string; from: string; to: string };
}

export interface CodeReadyEvent extends DomainEvent {
  eventType: typeof EventSubjects.CodeGeneration.CodeReady;
  payload: { taskId: string; fileCount: number };
}
