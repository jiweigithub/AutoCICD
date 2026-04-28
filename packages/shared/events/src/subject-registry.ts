export const Subjects = {
  PM: {
    StoryCreated: 'ulw.pm.story.created',
    StoryReady: 'ulw.pm.story.ready',
    SprintCommitted: 'ulw.pm.sprint.committed',
  },
  AD: {
    ArchitectureProposed: 'ulw.ad.architecture.proposed',
    ArchitectureApproved: 'ulw.ad.architecture.approved',
    ArchitectureRejected: 'ulw.ad.architecture.rejected',
    ContractPublished: 'ulw.ad.contract.published',
  },
  CG: {
    GenerationStarted: 'ulw.cg.generation.started',
    TDDTransition: 'ulw.cg.tdd.transition',
    CodeReady: 'ulw.cg.code.ready',
    GenerationFailed: 'ulw.cg.generation.failed',
  },
  CR: {
    ReviewStarted: 'ulw.cr.review.started',
    CheckCompleted: 'ulw.cr.check.completed',
    ReviewPassed: 'ulw.cr.review.passed',
    ReviewFailed: 'ulw.cr.review.failed',
  },
  TA: {
    TestRunStarted: 'ulw.ta.test.started',
    TestCaseCompleted: 'ulw.ta.case.completed',
    ContractBroken: 'ulw.ta.contract.broken',
  },
  DP: {
    ReleaseCreated: 'ulw.dp.release.created',
    StageCompleted: 'ulw.dp.stage.completed',
    Deployed: 'ulw.dp.deployed',
    RollbackTriggered: 'ulw.dp.rollback.triggered',
  },
  Security: {
    SecretDetected: 'ulw.security.secret.detected',
    PolicyViolation: 'ulw.security.policy.violation',
  },
} as const;

export type Subject = (typeof Subjects)[keyof typeof Subjects][keyof (typeof Subjects)[keyof typeof Subjects]];
