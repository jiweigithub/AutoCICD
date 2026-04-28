export interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  version: number;
}

export interface AggregateRoot {
  id: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValueObject {
  equals(other: ValueObject): boolean;
}

export interface Entity {
  id: string;
  equals(other: Entity): boolean;
}
