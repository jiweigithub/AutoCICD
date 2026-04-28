import { Entity, ValidationError } from '@ulw/shared-domain';

export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type StoryStatus = 'backlog' | 'ready' | 'in-progress' | 'done';

export class Story extends Entity {
  public sprintId: string;
  public title: string;
  public points: number;
  public priority: StoryPriority;
  public acceptanceCriteria: string;
  public status: StoryStatus;

  constructor(
    private readonly _id: string,
    sprintId: string,
    title: string,
    points: number,
    priority: StoryPriority = 'medium',
    acceptanceCriteria: string = '',
    status: StoryStatus = 'backlog',
  ) {
    super();
    if (!title || title.trim().length === 0) throw new ValidationError('title must not be empty');
    if (points < 0) throw new ValidationError('points must not be negative');
    this.sprintId = sprintId;
    this.title = title;
    this.points = points;
    this.priority = priority;
    this.acceptanceCriteria = acceptanceCriteria;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  markReady(): void {
    if (this.status !== 'backlog') throw new ValidationError('Only backlog stories can be marked ready');
    this.status = 'ready';
  }

  start(): void {
    if (this.status !== 'ready') throw new ValidationError('Only ready stories can be started');
    this.status = 'in-progress';
  }

  complete(): void {
    this.status = 'done';
  }
}
