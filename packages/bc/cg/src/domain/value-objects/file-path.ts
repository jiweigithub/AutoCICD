import { ValueObject } from '@ulw/shared-domain';

export class FilePath extends ValueObject {
  constructor(public readonly value: string) {
    super();
    if (!value || value.trim().length === 0) {
      throw new Error('FilePath must not be empty');
    }
    if (value.includes('..')) {
      throw new Error('FilePath must not contain parent traversal');
    }
  }

  getEqualityComponents(): unknown[] {
    return [this.value];
  }

  get extension(): string {
    const dot = this.value.lastIndexOf('.');
    return dot >= 0 ? this.value.slice(dot) : '';
  }
}
