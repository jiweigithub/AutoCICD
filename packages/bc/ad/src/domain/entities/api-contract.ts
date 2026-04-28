import { Entity, ValidationError } from '@ulw/shared-domain';

export class ApiContract extends Entity {
  public specId: string;
  public openApiSpec: string;
  public version: string;
  public status: 'draft' | 'published' | 'deprecated';

  constructor(
    private readonly _id: string,
    specId: string,
    openApiSpec: string,
    version: string = '1.0.0',
    status: 'draft' | 'published' | 'deprecated' = 'draft',
  ) {
    super();
    if (!specId || specId.trim().length === 0) throw new ValidationError('specId must not be empty');
    if (!openApiSpec || openApiSpec.trim().length === 0) throw new ValidationError('openApiSpec must not be empty');
    this.specId = specId;
    this.openApiSpec = openApiSpec;
    this.version = version;
    this.status = status;
  }

  get identity(): string { return this._id; }
  get id(): string { return this._id; }

  publish(): void {
    if (this.status !== 'draft') throw new ValidationError('Only draft contracts can be published');
    this.status = 'published';
  }

  deprecate(): void {
    this.status = 'deprecated';
  }
}
