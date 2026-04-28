import type { DomainEvent } from '@ulw/shared-domain';
import { EventSubjects } from '@ulw/shared-types';

export { EventSubjects };

export interface TestPassedEvent extends DomainEvent {
  eventType: typeof EventSubjects.Testing.CaseCompleted;
  payload: { suiteId: string; caseId: string; caseName: string };
}

export interface TestFailedEvent extends DomainEvent {
  eventType: typeof EventSubjects.Testing.CaseCompleted;
  payload: { suiteId: string; caseId: string; caseName: string; error: string };
}

export interface ContractBrokenEvent extends DomainEvent {
  eventType: typeof EventSubjects.Testing.ContractBroken;
  payload: { suiteId: string; contractId: string; mismatchCount: number };
}
