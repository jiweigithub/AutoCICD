export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly correlationId: string,
    eventId?: string,
  ) {
    this.eventId = eventId ?? crypto.randomUUID();
    this.occurredAt = new Date();
  }

  abstract get eventType(): string;
}
