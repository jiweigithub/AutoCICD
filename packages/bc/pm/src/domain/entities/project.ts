import { AggregateRoot, ValidationError } from '@ulw/shared-domain';
import type { Sprint } from './sprint.js';

export class Project extends AggregateRoot {
  public name: string;
  public description: string;
  public status: 'active' | 'archived' | 'completed';
  public sprints: Sprint[];
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    name: string,
    description: string,
    status: 'active' | 'archived' | 'completed' = 'active',
  ) {
    super();
    if (!name || name.trim().length === 0) throw new ValidationError('name must not be empty');
    this.name = name;
    this.description = description;
    this.status = status;
    this.sprints = [];
    this._version = 1;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }
  get version(): number { return this._version; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  archive(): void {
    if (this.status !== 'active') throw new ValidationError('Only active projects can be archived');
    this.status = 'archived';
    this._version++;
    this._updatedAt = new Date();
  }

  addSprint(sprint: Sprint): void {
    this.sprints.push(sprint);
    this._version++;
    this._updatedAt = new Date();
  }
}
