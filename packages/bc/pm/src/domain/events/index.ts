import type { DomainEvent } from '@ulw/shared-domain';
import { EventSubjects } from '@ulw/shared-types';

export { EventSubjects };

export interface StoryCreatedEvent extends DomainEvent {
  eventType: typeof EventSubjects.ProjectManagement.StoryCreated;
  payload: {
    storyId: string;
    sprintId: string;
    title: string;
    points: number;
    priority: string;
  };
}

export interface StoryReadyEvent extends DomainEvent {
  eventType: typeof EventSubjects.ProjectManagement.StoryReady;
  payload: {
    storyId: string;
    sprintId: string;
  };
}

export interface SprintCommittedEvent extends DomainEvent {
  eventType: typeof EventSubjects.ProjectManagement.SprintCommitted;
  payload: {
    sprintId: string;
    projectId: string;
    goal: string;
    storyCount: number;
  };
}
