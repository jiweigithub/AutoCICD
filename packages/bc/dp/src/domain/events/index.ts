import type { DomainEvent } from '@ulw/shared-domain';
import { EventSubjects } from '@ulw/shared-types';

export { EventSubjects };

export interface DeployedEvent extends DomainEvent {
  eventType: typeof EventSubjects.Deployment.Deployed;
  payload: { releaseId: string; version: string; environment: string };
}

export interface RollbackTriggeredEvent extends DomainEvent {
  eventType: typeof EventSubjects.Deployment.RollbackTriggered;
  payload: { releaseId: string; rollbackId: string; reason: string };
}
