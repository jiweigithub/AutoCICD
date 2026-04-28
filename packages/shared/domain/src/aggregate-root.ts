import type { DomainEvent } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot extends Entity {
  private _pendingEvents: DomainEvent[] = [];

  pullEvents(): DomainEvent[] {
    const events = [...this._pendingEvents];
    this._pendingEvents = [];
    return events;
  }

  addDomainEvent(event: DomainEvent): void {
    this._pendingEvents.push(event);
    super.addDomainEvent(event);
  }

  clearEvents(): void {
    this._pendingEvents = [];
    super.clearEvents();
  }
}
