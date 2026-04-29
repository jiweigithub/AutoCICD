import type { PipelineStage } from './pipeline.js';

export interface PipelineEvent {
  eventId: string;
  eventType: string;
  pipelineId: string;
  stage: PipelineStage;
  occurredAt: string;
  data: Record<string, unknown>;
}

export interface MessageMetadata {
  correlationId: string;
  causationId: string | null;
  source: string;
  traceId: string;
  userId: string | null;
  tenantId: string | null;
}

export interface MessageEnvelope<T = unknown> {
  envelopeId: string;
  subject: string;
  eventType: string;
  data: T;
  metadata: MessageMetadata;
  timestamp: string;
}
