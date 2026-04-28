import { ValueObject } from '@ulw/shared-domain';
import { Severity } from '../entities/index.js';

export class SeverityThreshold extends ValueObject {
  constructor(public readonly minimum: Severity) {
    super();
  }

  getEqualityComponents(): unknown[] {
    return [this.minimum];
  }

  isViolated(severity: Severity): boolean {
    const order: Severity[] = [Severity.Info, Severity.Low, Severity.Medium, Severity.High, Severity.Critical];
    return order.indexOf(severity) >= order.indexOf(this.minimum);
  }
}
