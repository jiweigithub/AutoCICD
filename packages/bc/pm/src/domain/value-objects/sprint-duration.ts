import { ValueObject } from '@ulw/shared-domain';

export class SprintDuration extends ValueObject {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {
    super();
    if (endDate <= startDate) {
      throw new Error('endDate must be after startDate');
    }
  }

  getEqualityComponents(): unknown[] {
    return [this.startDate.getTime(), this.endDate.getTime()];
  }

  get totalDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
