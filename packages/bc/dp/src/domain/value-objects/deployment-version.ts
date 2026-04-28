import { ValueObject } from '@ulw/shared-domain';

export class DeploymentVersion extends ValueObject {
  constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
  ) {
    super();
    if (major < 0 || minor < 0 || patch < 0) throw new Error('Version numbers must not be negative');
  }

  getEqualityComponents(): unknown[] {
    return [this.major, this.minor, this.patch];
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  isNewerThan(other: DeploymentVersion): boolean {
    if (this.major !== other.major) return this.major > other.major;
    if (this.minor !== other.minor) return this.minor > other.minor;
    return this.patch > other.patch;
  }

  static parse(version: string): DeploymentVersion {
    const parts = version.split('.').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) throw new Error(`Invalid version: ${version}`);
    return new DeploymentVersion(parts[0]!, parts[1]!, parts[2]!);
  }
}
