import { AggregateRoot, Entity, ValidationError } from '@ulw/shared-domain';

export type Environment = 'development' | 'staging' | 'production';
export type StageType = 'build' | 'test' | 'deploy' | 'verify' | 'notify';

export class Release extends AggregateRoot {
  public version: string;
  public environment: Environment;
  public artifactUrl: string;
  public status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled-back';
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    version: string,
    environment: Environment,
    artifactUrl: string = '',
    status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled-back' = 'pending',
  ) {
    super();
    if (!version || version.trim().length === 0) throw new ValidationError('version must not be empty');
    if (!environment || environment.trim().length === 0) throw new ValidationError('environment must not be empty');
    this.version = version;
    this.environment = environment;
    this.artifactUrl = artifactUrl;
    this.status = status;
    this._version = 1;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }
  get versionCount(): number { return this._version; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  startDeploy(): void {
    if (this.status !== 'pending') throw new ValidationError('Only pending releases can start deploying');
    this.status = 'deploying';
    this._version++;
    this._updatedAt = new Date();
  }

  markDeployed(): void {
    this.status = 'deployed';
    this._version++;
    this._updatedAt = new Date();
  }

  markFailed(): void {
    this.status = 'failed';
    this._version++;
    this._updatedAt = new Date();
  }

  markRolledBack(): void {
    this.status = 'rolled-back';
    this._version++;
    this._updatedAt = new Date();
  }
}

export class PipelineStage extends Entity {
  public releaseId: string;
  public stageType: StageType;
  public status: 'pending' | 'running' | 'succeeded' | 'failed';

  constructor(
    private readonly _id: string,
    releaseId: string,
    stageType: StageType,
    status: 'pending' | 'running' | 'succeeded' | 'failed' = 'pending',
  ) {
    super();
    if (!releaseId || releaseId.trim().length === 0) throw new ValidationError('releaseId must not be empty');
    this.releaseId = releaseId;
    this.stageType = stageType;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  start(): void { if (this.status === 'pending') this.status = 'running'; }
  succeed(): void { this.status = 'succeeded'; }
  fail(): void { this.status = 'failed'; }
}

export class Rollback extends Entity {
  public releaseId: string;
  public reason: string;
  public trigger: 'automatic' | 'manual';
  public status: 'pending' | 'in-progress' | 'completed' | 'failed';

  constructor(
    private readonly _id: string,
    releaseId: string,
    reason: string,
    trigger: 'automatic' | 'manual' = 'manual',
    status: 'pending' | 'in-progress' | 'completed' | 'failed' = 'pending',
  ) {
    super();
    if (!releaseId || releaseId.trim().length === 0) throw new ValidationError('releaseId must not be empty');
    if (!reason || reason.trim().length === 0) throw new ValidationError('reason must not be empty');
    this.releaseId = releaseId;
    this.reason = reason;
    this.trigger = trigger;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  execute(): void { this.status = 'in-progress'; }
  complete(): void { this.status = 'completed'; }
  fail(): void { this.status = 'failed'; }
}
