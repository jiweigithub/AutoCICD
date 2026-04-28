declare const IdentifierBrand: unique symbol;

export class Identifier<T> {
  // @ts-expect-error Brand is used at the type level only
  private readonly brand: typeof IdentifierBrand;

  constructor(private readonly value: T) {}

  get toValue(): T {
    return this.value;
  }

  equals(other: Identifier<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
