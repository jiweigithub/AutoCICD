import { ValueObject } from '@ulw/shared-domain';

export class SemVer extends ValueObject {
  constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
    public readonly prerelease: string | null = null,
  ) {
    super();
    if (major < 0 || minor < 0 || patch < 0) {
      throw new Error('Version components must not be negative');
    }
  }

  getEqualityComponents(): unknown[] {
    return [this.major, this.minor, this.patch, this.prerelease];
  }

  toString(): string {
    const base = `${this.major}.${this.minor}.${this.patch}`;
    return this.prerelease ? `${base}-${this.prerelease}` : base;
  }

  static parse(version: string): SemVer {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) throw new Error(`Invalid semver: ${version}`);
    return new SemVer(
      parseInt(match[1]!, 10),
      parseInt(match[2]!, 10),
      parseInt(match[3]!, 10),
      match[4] ?? null,
    );
  }
}
