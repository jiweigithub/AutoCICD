import type { DomainEvent } from './domain-event.js';

export abstract class Entity {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }

  addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  removeDomainEvent(event: DomainEvent): void {
    this._domainEvents = this._domainEvents.filter((e) => e.eventId !== event.eventId);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  equals(other: Entity): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return this.identity === other.identity;
  }

  protected abstract get identity(): string;
}
