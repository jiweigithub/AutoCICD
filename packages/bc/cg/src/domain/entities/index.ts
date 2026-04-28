import { AggregateRoot, Entity, ValidationError } from '@ulw/shared-domain';

export enum TDDState { Red = 'red', Green = 'green', Refactor = 'refactor' }

export class GenerationTask extends AggregateRoot {
  public archSpecId: string;
  public tddState: TDDState;
  public worktreeRef: string;
  public status: 'pending' | 'in-progress' | 'completed' | 'failed';
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    archSpecId: string,
    worktreeRef: string = '',
    tddState: TDDState = TDDState.Red,
    status: 'pending' | 'in-progress' | 'completed' | 'failed' = 'pending',
  ) {
    super();
    if (!archSpecId || archSpecId.trim().length === 0) throw new ValidationError('archSpecId must not be empty');
    this.archSpecId = archSpecId;
    this.tddState = tddState;
    this.worktreeRef = worktreeRef;
    this.status = status;
    this._version = 1;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }
  get version(): number { return this._version; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  transitionTDD(to: TDDState): void {
    this.tddState = to;
    this._version++;
    this._updatedAt = new Date();
  }

  start(): void {
    if (this.status !== 'pending') throw new ValidationError('Only pending tasks can be started');
    this.status = 'in-progress';
    this._version++;
    this._updatedAt = new Date();
  }

  complete(): void {
    this.status = 'completed';
    this._version++;
    this._updatedAt = new Date();
  }
}

export class GeneratedFile extends Entity {
  public taskId: string;
  public path: string;
  public content: string;
  public status: 'pending' | 'written' | 'verified';

  constructor(
    private readonly _id: string,
    taskId: string,
    path: string,
    content: string = '',
    status: 'pending' | 'written' | 'verified' = 'pending',
  ) {
    super();
    if (!taskId || taskId.trim().length === 0) throw new ValidationError('taskId must not be empty');
    if (!path || path.trim().length === 0) throw new ValidationError('path must not be empty');
    this.taskId = taskId;
    this.path = path;
    this.content = content;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  markWritten(): void { this.status = 'written'; }
}

export class PullRequest extends Entity {
  public taskId: string;
  public branch: string;
  public status: 'draft' | 'open' | 'merged' | 'closed';

  constructor(
    private readonly _id: string,
    taskId: string,
    branch: string,
    status: 'draft' | 'open' | 'merged' | 'closed' = 'draft',
  ) {
    super();
    if (!taskId || taskId.trim().length === 0) throw new ValidationError('taskId must not be empty');
    if (!branch || branch.trim().length === 0) throw new ValidationError('branch must not be empty');
    this.taskId = taskId;
    this.branch = branch;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  open(): void { this.status = 'open'; }
}
