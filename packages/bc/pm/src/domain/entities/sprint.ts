import { Entity, ValidationError } from '@ulw/shared-domain';
import type { Story } from './story.js';

export class Sprint extends Entity {
  public projectId: string;
  public goal: string;
  public startDate: Date;
  public endDate: Date;
  public status: 'planning' | 'active' | 'completed';
  public stories: Story[];

  constructor(
    private readonly _id: string,
    projectId: string,
    goal: string,
    startDate: Date,
    endDate: Date,
    status: 'planning' | 'active' | 'completed' = 'planning',
  ) {
    super();
    if (!projectId || projectId.trim().length === 0) throw new ValidationError('projectId must not be empty');
    if (!goal || goal.trim().length === 0) throw new ValidationError('goal must not be empty');
    this.projectId = projectId;
    this.goal = goal;
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = status;
    this.stories = [];
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  commit(): void {
    if (this.status !== 'planning') throw new ValidationError('Only planning sprints can be committed');
    this.status = 'active';
  }

  addStory(story: Story): void {
    this.stories.push(story);
  }
}
