import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().default(5432),
  database: z.string().default('ulw'),
  user: z.string().default('postgres'),
  password: z.string().default('postgres'),
  maxConnections: z.coerce.number().int().default(20),
  ssl: z.boolean().default(false),
});

export const RedisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().default(6379),
  password: z.string().optional(),
  db: z.coerce.number().int().default(0),
  keyPrefix: z.string().default('ulw:'),
});

export const NATSConfigSchema = z.object({
  servers: z.string().default('nats://localhost:4222'),
  streamName: z.string().default('ulw-events'),
  maxReconnectAttempts: z.coerce.number().int().default(10),
  reconnectWaitMs: z.coerce.number().int().default(2000),
});

export const MinioConfigSchema = z.object({
  endpoint: z.string().default('http://localhost:9000'),
  bucket: z.string().default('ulw-artifacts'),
  accessKey: z.string(),
  secretKey: z.string(),
  useSSL: z.boolean().default(false),
  region: z.string().default('us-east-1'),
});

export const KeycloakConfigSchema = z.object({
  serverUrl: z.string().default('http://localhost:8080'),
  realm: z.string().default('ulw'),
  clientId: z.string(),
  clientSecret: z.string(),
});

export const AgentsConfigSchema = z.object({
  maxConcurrentAgents: z.coerce.number().int().default(5),
  defaultTimeoutMs: z.coerce.number().int().default(300000),
  retryAttempts: z.coerce.number().int().default(3),
  llmProvider: z.enum(['openai', 'anthropic', 'local']).default('openai'),
  llmModel: z.string().default('gpt-4o'),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
});

export const ReviewConfigSchema = z.object({
  autoApproveThreshold: z.coerce.number().int().default(0),
  requireApproval: z.boolean().default(true),
  blockingCheckTypes: z.array(z.string()).default(['security', 'type-check']),
  maxFindingsPerReview: z.coerce.number().int().default(100),
});

export const PipelineConfigSchema = z.object({
  defaultTimeoutSeconds: z.coerce.number().int().default(3600),
  artifactRetentionDays: z.coerce.number().int().default(30),
  canaryEnabled: z.boolean().default(false),
  canaryDurationSeconds: z.coerce.number().int().default(600),
  maxParallelStages: z.coerce.number().int().default(3),
});

export const AppConfigSchema = z.object({
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  nats: NATSConfigSchema,
  minio: MinioConfigSchema,
  keycloak: KeycloakConfigSchema,
  agents: AgentsConfigSchema,
  review: ReviewConfigSchema,
  pipeline: PipelineConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type NATSConfig = z.infer<typeof NATSConfigSchema>;
export type MinioConfig = z.infer<typeof MinioConfigSchema>;
export type KeycloakConfig = z.infer<typeof KeycloakConfigSchema>;
export type AgentsConfig = z.infer<typeof AgentsConfigSchema>;
export type ReviewConfig = z.infer<typeof ReviewConfigSchema>;
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
