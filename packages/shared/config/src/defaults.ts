import type { AppConfig } from './schema.js';

export const devDefaults: AppConfig = {
  redis: {
    host: 'localhost',
    port: 6379,
    password: undefined,
    db: 0,
    keyPrefix: 'ulw:',
  },
  minio: {
    endpoint: 'http://localhost:9000',
    bucket: 'ulw-artifacts',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    useSSL: false,
    region: 'us-east-1',
  },
  keycloak: {
    serverUrl: 'http://localhost:8080',
    realm: 'ulw',
    clientId: 'ulw-api',
    clientSecret: 'dev-secret-change-me',
  },
  agents: {
    maxConcurrentAgents: 5,
    defaultTimeoutMs: 300000,
    retryAttempts: 3,
    llmProvider: 'openai',
    llmModel: 'gpt-4o',
    temperature: 0.7,
  },
  review: {
    autoApproveThreshold: 0,
    requireApproval: true,
    blockingCheckTypes: ['security', 'type-check'],
    maxFindingsPerReview: 100,
  },
  pipeline: {
    defaultTimeoutSeconds: 3600,
    artifactRetentionDays: 30,
    canaryEnabled: false,
    canaryDurationSeconds: 600,
    maxParallelStages: 3,
    stages: {
      specParsing: { timeoutSeconds: 300 },
      architectureDesign: { timeoutSeconds: 600 },
      tddCodeGen: { timeoutSeconds: 1800 },
      codeReview: { timeoutSeconds: 900 },
      automatedTesting: { timeoutSeconds: 1200 },
      deployment: { timeoutSeconds: 1800 },
    },
  },
};
