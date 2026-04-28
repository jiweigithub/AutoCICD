import { AggregateRoot, ValidationError } from '@ulw/shared-domain';

export type ArchitectureDecision = {
  id: string;
  title: string;
  rationale: string;
  consequences: string;
  status: 'proposed' | 'accepted' | 'superseded';
};

export class ArchitectureSpec extends AggregateRoot {
  public storyId: string;
  public contextMap: Record<string, unknown>;
  public decisions: ArchitectureDecision[];
  public status: 'draft' | 'proposed' | 'approved' | 'rejected';
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    storyId: string,
    contextMap: Record<string, unknown> = {},
    status: 'draft' | 'proposed' | 'approved' | 'rejected' = 'draft',
  ) {
    super();
    if (!storyId || storyId.trim().length === 0) throw new ValidationError('storyId must not be empty');
    this.storyId = storyId;
    this.contextMap = contextMap;
    this.decisions = [];
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

  propose(): void {
    if (this.status !== 'draft') throw new ValidationError('Only draft specs can be proposed');
    this.status = 'proposed';
    this._version++;
    this._updatedAt = new Date();
  }

  approve(): void {
    if (this.status !== 'proposed') throw new ValidationError('Only proposed specs can be approved');
    this.status = 'approved';
    this._version++;
    this._updatedAt = new Date();
  }

  reject(reason: string): void {
    if (this.status !== 'proposed') throw new ValidationError('Only proposed specs can be rejected');
    this.status = 'rejected';
    this._version++;
    this._updatedAt = new Date();
  }

  addDecision(decision: ArchitectureDecision): void {
    this.decisions.push(decision);
    this._version++;
    this._updatedAt = new Date();
  }
}
