export abstract class ValueObject {
  protected abstract getEqualityComponents(): unknown[];

  get hashCode(): string {
    return this.getEqualityComponents()
      .map((c) => JSON.stringify(c))
      .join('|');
  }

  equals(other: ValueObject): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return this.hashCode === other.hashCode;
  }
}
