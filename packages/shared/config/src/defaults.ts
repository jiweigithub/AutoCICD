import type { AppConfig } from './schema.js';

export const devDefaults: AppConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'ulw',
    user: 'postgres',
    password: 'postgres',
    maxConnections: 20,
    ssl: false,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: undefined,
    db: 0,
    keyPrefix: 'ulw:',
  },
  nats: {
    servers: 'nats://localhost:4222',
    streamName: 'ulw-events',
    maxReconnectAttempts: 10,
    reconnectWaitMs: 2000,
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
  },
};
