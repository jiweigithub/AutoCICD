import { AggregateRoot, Entity, ValidationError } from '@ulw/shared-domain';

export enum Severity { Critical = 'critical', High = 'high', Medium = 'medium', Low = 'low', Info = 'info' }
export enum CheckType { StaticAnalysis = 'static-analysis', TypeCheck = 'type-check', Lint = 'lint', Security = 'security', Architecture = 'architecture', StyleGuide = 'style-guide' }

export interface Finding {
  findingId: string;
  file: string;
  line: number;
  severity: Severity;
  checkType: CheckType;
  message: string;
}

export class ReviewSession extends AggregateRoot {
  public prId: string;
  public status: 'pending' | 'in-progress' | 'completed' | 'failed';
  public findings: Finding[];
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    prId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'failed' = 'pending',
  ) {
    super();
    if (!prId || prId.trim().length === 0) throw new ValidationError('prId must not be empty');
    this.prId = prId;
    this.status = status;
    this.findings = [];
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
    if (this.status !== 'pending') throw new ValidationError('Only pending reviews can be started');
    this.status = 'in-progress';
    this._version++;
    this._updatedAt = new Date();
  }

  addFinding(finding: Finding): void {
    this.findings.push(finding);
    this._version++;
    this._updatedAt = new Date();
  }

  complete(passed: boolean): void {
    this.status = passed ? 'completed' : 'failed';
    this._version++;
    this._updatedAt = new Date();
  }
}

export class ReviewCheck extends Entity {
  public sessionId: string;
  public checkType: CheckType;
  public result: 'passed' | 'failed' | 'warning';

  constructor(
    private readonly _id: string,
    sessionId: string,
    checkType: CheckType,
    result: 'passed' | 'failed' | 'warning' = 'passed',
  ) {
    super();
    if (!sessionId || sessionId.trim().length === 0) throw new ValidationError('sessionId must not be empty');
    this.sessionId = sessionId;
    this.checkType = checkType;
    this.result = result;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }
}

export class Violation extends Entity {
  public checkId: string;
  public severity: Severity;
  public file: string;
  public line: number;
  public message: string;

  constructor(
    private readonly _id: string,
    checkId: string,
    severity: Severity,
    file: string,
    line: number,
    message: string,
  ) {
    super();
    if (!checkId || checkId.trim().length === 0) throw new ValidationError('checkId must not be empty');
    if (!file || file.trim().length === 0) throw new ValidationError('file must not be empty');
    if (!message || message.trim().length === 0) throw new ValidationError('message must not be empty');
    this.checkId = checkId;
    this.severity = severity;
    this.file = file;
    this.line = line;
    this.message = message;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }
}
