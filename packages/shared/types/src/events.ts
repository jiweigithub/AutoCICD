export const NATS_SUBJECT_PREFIX = 'ulw' as const;

export const EventSubjects = {
  ProjectManagement: {
    StoryCreated: `${NATS_SUBJECT_PREFIX}.pm.story.created`,
    StoryReady: `${NATS_SUBJECT_PREFIX}.pm.story.ready`,
    SprintCommitted: `${NATS_SUBJECT_PREFIX}.pm.sprint.committed`,
  },
  Architecture: {
    Proposed: `${NATS_SUBJECT_PREFIX}.ad.architecture.proposed`,
    Approved: `${NATS_SUBJECT_PREFIX}.ad.architecture.approved`,
    Rejected: `${NATS_SUBJECT_PREFIX}.ad.architecture.rejected`,
    ContractPublished: `${NATS_SUBJECT_PREFIX}.ad.contract.published`,
  },
  CodeGeneration: {
    Started: `${NATS_SUBJECT_PREFIX}.cg.generation.started`,
    TDDTransition: `${NATS_SUBJECT_PREFIX}.cg.tdd.transition`,
    CodeReady: `${NATS_SUBJECT_PREFIX}.cg.code.ready`,
    Failed: `${NATS_SUBJECT_PREFIX}.cg.generation.failed`,
  },
  CodeReview: {
    Started: `${NATS_SUBJECT_PREFIX}.cr.review.started`,
    CheckCompleted: `${NATS_SUBJECT_PREFIX}.cr.check.completed`,
    Passed: `${NATS_SUBJECT_PREFIX}.cr.review.passed`,
    Failed: `${NATS_SUBJECT_PREFIX}.cr.review.failed`,
  },
  Testing: {
    RunStarted: `${NATS_SUBJECT_PREFIX}.ta.test.started`,
    CaseCompleted: `${NATS_SUBJECT_PREFIX}.ta.case.completed`,
    ContractBroken: `${NATS_SUBJECT_PREFIX}.ta.contract.broken`,
  },
  Deployment: {
    ReleaseCreated: `${NATS_SUBJECT_PREFIX}.dp.release.created`,
    StageCompleted: `${NATS_SUBJECT_PREFIX}.dp.stage.completed`,
    Deployed: `${NATS_SUBJECT_PREFIX}.dp.deployed`,
    RollbackTriggered: `${NATS_SUBJECT_PREFIX}.dp.rollback.triggered`,
  },
  Security: {
    SecretDetected: `${NATS_SUBJECT_PREFIX}.security.secret.detected`,
    PolicyViolation: `${NATS_SUBJECT_PREFIX}.security.policy.violation`,
  },
} as const;

export type EventSubject = (typeof EventSubjects)[keyof typeof EventSubjects][keyof (typeof EventSubjects)[keyof typeof EventSubjects]];

export interface MessageEnvelope<T = unknown> {
  envelopeId: string;
  subject: string;
  eventType: string;
  data: T;
  metadata: MessageMetadata;
  timestamp: Date;
}

export interface MessageMetadata {
  correlationId: string;
  causationId: string | null;
  source: string;
  traceId: string;
  userId: string | null;
  tenantId: string | null;
}
