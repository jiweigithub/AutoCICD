import { AggregateRoot, Entity, ValidationError } from '@ulw/shared-domain';

export enum TestType { Unit = 'unit', Integration = 'integration', E2E = 'e2e', Contract = 'contract', Performance = 'performance', Smoke = 'smoke' }

export class TestSuite extends AggregateRoot {
  public contractId: string;
  public testType: TestType;
  public status: 'pending' | 'running' | 'completed' | 'failed';
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    contractId: string,
    testType: TestType,
    status: 'pending' | 'running' | 'completed' | 'failed' = 'pending',
  ) {
    super();
    if (!contractId || contractId.trim().length === 0) throw new ValidationError('contractId must not be empty');
    this.contractId = contractId;
    this.testType = testType;
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

  start(): void {
    if (this.status !== 'pending') throw new ValidationError('Only pending suites can be started');
    this.status = 'running';
    this._version++;
    this._updatedAt = new Date();
  }

  finish(success: boolean): void {
    this.status = success ? 'completed' : 'failed';
    this._version++;
    this._updatedAt = new Date();
  }
}

export class TestCase extends Entity {
  public suiteId: string;
  public name: string;
  public status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

  constructor(
    private readonly _id: string,
    suiteId: string,
    name: string,
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' = 'pending',
  ) {
    super();
    if (!suiteId || suiteId.trim().length === 0) throw new ValidationError('suiteId must not be empty');
    if (!name || name.trim().length === 0) throw new ValidationError('name must not be empty');
    this.suiteId = suiteId;
    this.name = name;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  pass(): void { this.status = 'passed'; }
  fail(): void { this.status = 'failed'; }
  skip(): void { this.status = 'skipped'; }
}

export class TestRun extends Entity {
  public suiteId: string;
  public status: 'pending' | 'running' | 'completed' | 'failed';
  public coverage: number;

  constructor(
    private readonly _id: string,
    suiteId: string,
    status: 'pending' | 'running' | 'completed' | 'failed' = 'pending',
    coverage: number = 0,
  ) {
    super();
    if (!suiteId || suiteId.trim().length === 0) throw new ValidationError('suiteId must not be empty');
    this.suiteId = suiteId;
    this.status = status;
    this.coverage = coverage;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  setCoverage(pct: number): void {
    if (pct < 0 || pct > 100) throw new ValidationError('Coverage must be 0-100');
    this.coverage = pct;
  }
}
