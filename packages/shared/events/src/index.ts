export { MessageMetadataSchema, MessageEnvelopeSchema, createEnvelope } from './envelope.js';

export {
  StageStartedEventSchema,
  StageCompletedEventSchema,
} from './schemas/pipeline-events.js';
export type { StageStartedEvent, StageCompletedEvent } from './schemas/pipeline-events.js';

export {
  PipelineStartedEventSchema,
  PipelineFailedEventSchema,
  PipelineCompletedEventSchema,
} from './schemas/pipeline-lifecycle.js';
export type {
  PipelineStartedEvent,
  PipelineFailedEvent,
  PipelineCompletedEvent,
} from './schemas/pipeline-lifecycle.js';

export {
  UserApprovalRequestedSchema,
  UserApprovalReceivedSchema,
} from './schemas/approval-events.js';
export type { UserApprovalRequested, UserApprovalReceived } from './schemas/approval-events.js';

export {
  SecretDetectedSchema,
  PolicyViolationSchema,
} from './schemas/security-events.js';
export type { SecretDetected, PolicyViolation } from './schemas/security-events.js';
