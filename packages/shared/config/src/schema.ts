import { z } from 'zod';

export const RedisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().default(6379),
  password: z.string().optional(),
  db: z.coerce.number().int().default(0),
  keyPrefix: z.string().default('ulw:'),
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
  stages: z
    .object({
      specParsing: z.object({ timeoutSeconds: z.number().int().default(300) }).default({}),
      architectureDesign: z.object({ timeoutSeconds: z.number().int().default(600) }).default({}),
      tddCodeGen: z.object({ timeoutSeconds: z.number().int().default(1800) }).default({}),
      codeReview: z.object({ timeoutSeconds: z.number().int().default(900) }).default({}),
      automatedTesting: z.object({ timeoutSeconds: z.number().int().default(1200) }).default({}),
      deployment: z.object({ timeoutSeconds: z.number().int().default(1800) }).default({}),
    })
    .default({}),
});

export const AppConfigSchema = z.object({
  redis: RedisConfigSchema,
  minio: MinioConfigSchema,
  keycloak: KeycloakConfigSchema,
  agents: AgentsConfigSchema,
  review: ReviewConfigSchema,
  pipeline: PipelineConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type MinioConfig = z.infer<typeof MinioConfigSchema>;
export type KeycloakConfig = z.infer<typeof KeycloakConfigSchema>;
export type AgentsConfig = z.infer<typeof AgentsConfigSchema>;
export type ReviewConfig = z.infer<typeof ReviewConfigSchema>;
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
