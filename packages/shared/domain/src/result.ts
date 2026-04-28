export class Result<T, E = Error> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: E | null,
    private readonly _isOk: boolean,
  ) {}

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(value, null, true);
  }

  static err<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(null, error, false);
  }

  get isOk(): boolean {
    return this._isOk;
  }

  get isErr(): boolean {
    return !this._isOk;
  }

  get value(): T {
    if (!this._isOk) {
      throw new Error('Cannot get value from an Err result');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isOk) {
      throw new Error('Cannot get error from an Ok result');
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isOk) {
      return Result.ok<U, E>(fn(this._value as T));
    }
    return Result.err<U, E>(this._error as E);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isOk) {
      return fn(this._value as T);
    }
    return Result.err<U, E>(this._error as E);
  }

  match<U>(onOk: (value: T) => U, onErr: (error: E) => U): U {
    if (this._isOk) {
      return onOk(this._value as T);
    }
    return onErr(this._error as E);
  }

  unwrap(): T {
    if (!this._isOk) {
      throw this._error instanceof Error ? this._error : new Error(String(this._error));
    }
    return this._value as T;
  }

  unwrapOr(defaultValue: T): T {
    if (this._isOk) {
      return this._value as T;
    }
    return defaultValue;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    if (this._isOk) {
      return this._value as T;
    }
    return fn(this._error as E);
  }
}
