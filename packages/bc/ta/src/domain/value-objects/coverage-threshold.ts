import { ValueObject } from '@ulw/shared-domain';

export class CoverageThreshold extends ValueObject {
  constructor(
    public readonly lineMinimum: number,
    public readonly branchMinimum: number,
  ) {
    super();
    if (lineMinimum < 0 || lineMinimum > 100) throw new Error('lineMinimum must be 0-100');
    if (branchMinimum < 0 || branchMinimum > 100) throw new Error('branchMinimum must be 0-100');
  }

  getEqualityComponents(): unknown[] {
    return [this.lineMinimum, this.branchMinimum];
  }

  isSatisfied(lineCoverage: number, branchCoverage: number): boolean {
    return lineCoverage >= this.lineMinimum && branchCoverage >= this.branchMinimum;
  }
}
