export { MessageMetadataSchema, MessageEnvelopeSchema, createEnvelope } from './envelope.js';
export { Subjects } from './subject-registry.js';
export type { Subject } from './subject-registry.js';

export {
  StoryCreatedSchema,
  StoryReadySchema,
  SprintCommittedSchema,
} from './schemas/project-events.js';
export type { StoryCreated, StoryReady, SprintCommitted } from './schemas/project-events.js';

export {
  ArchitectureProposedSchema,
  ArchitectureApprovedSchema,
  ArchitectureRejectedSchema,
  ContractPublishedSchema,
} from './schemas/architecture-events.js';
export type {
  ArchitectureProposed,
  ArchitectureApproved,
  ArchitectureRejected,
  ContractPublished,
} from './schemas/architecture-events.js';

export {
  GenerationStartedSchema,
  TDDTransitionSchema,
  CodeReadySchema,
  GenerationFailedSchema,
} from './schemas/code-events.js';
export type {
  GenerationStarted,
  TDDTransition,
  CodeReady,
  GenerationFailed,
} from './schemas/code-events.js';

export {
  ReviewStartedSchema,
  CheckCompletedSchema,
  ReviewPassedSchema,
  ReviewFailedSchema,
} from './schemas/review-events.js';
export type {
  ReviewStarted,
  CheckCompleted,
  ReviewPassed,
  ReviewFailed,
} from './schemas/review-events.js';

export {
  TestRunStartedSchema,
  TestCaseCompletedSchema,
  ContractBrokenSchema,
} from './schemas/testing-events.js';
export type {
  TestRunStarted,
  TestCaseCompleted,
  ContractBroken,
} from './schemas/testing-events.js';

export {
  ReleaseCreatedSchema,
  StageCompletedSchema,
  DeployedSchema,
  RollbackTriggeredSchema,
} from './schemas/deployment-events.js';
export type {
  ReleaseCreated,
  StageCompleted,
  Deployed,
  RollbackTriggered,
} from './schemas/deployment-events.js';

export {
  SecretDetectedSchema,
  PolicyViolationSchema,
} from './schemas/security-events.js';
export type { SecretDetected, PolicyViolation } from './schemas/security-events.js';
