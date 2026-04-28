import type { AppConfig } from './schema.js';
import { AppConfigSchema } from './schema.js';
import { devDefaults } from './defaults.js';
import { existsSync, readFileSync } from 'node:fs';

export class ConfigLoader {
  private config: AppConfig | null = null;

  load(configPath?: string): AppConfig {
    if (this.config) {
      return this.config;
    }

    const fileConfig = configPath && existsSync(configPath)
      ? this.loadConfigFile(configPath)
      : {};

    const envConfig = this.loadFromEnv();

    const merged = this.deepMerge(devDefaults, fileConfig, envConfig);
    this.config = AppConfigSchema.parse(merged);
    return this.config;
  }

  get(): AppConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  private loadConfigFile(path: string): Record<string, unknown> {
    const raw = readFileSync(path, 'utf-8');
    if (path.endsWith('.json')) {
      return JSON.parse(raw) as Record<string, unknown>;
    }
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      throw new Error('YAML config loading requires "yaml" package. Install: pnpm add yaml');
    }
    throw new Error(`Unsupported config file format: ${path}`);
  }

  private loadFromEnv(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    const envMap: Record<string, string> = {
      DB_HOST: 'database.host',
      DB_PORT: 'database.port',
      DB_NAME: 'database.database',
      DB_USER: 'database.user',
      DB_PASSWORD: 'database.password',
      DB_MAX_CONNECTIONS: 'database.maxConnections',
      REDIS_HOST: 'redis.host',
      REDIS_PORT: 'redis.port',
      REDIS_PASSWORD: 'redis.password',
      NATS_SERVERS: 'nats.servers',
      NATS_STREAM: 'nats.streamName',
      MINIO_ENDPOINT: 'minio.endpoint',
      MINIO_BUCKET: 'minio.bucket',
      MINIO_ACCESS_KEY: 'minio.accessKey',
      MINIO_SECRET_KEY: 'minio.secretKey',
      KEYCLOAK_URL: 'keycloak.serverUrl',
      KEYCLOAK_REALM: 'keycloak.realm',
      KEYCLOAK_CLIENT_ID: 'keycloak.clientId',
      KEYCLOAK_CLIENT_SECRET: 'keycloak.clientSecret',
      AGENTS_MAX_CONCURRENT: 'agents.maxConcurrentAgents',
      AGENTS_TIMEOUT_MS: 'agents.defaultTimeoutMs',
      LLM_PROVIDER: 'agents.llmProvider',
      LLM_MODEL: 'agents.llmModel',
    };

    for (const [envKey, configPath] of Object.entries(envMap)) {
      const value = process.env[envKey];
      if (value !== undefined) {
        this.setNested(result, configPath, value);
      }
    }

    return result;
  }

  private setNested(obj: Record<string, unknown>, path: string, value: string): void {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!;
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    const lastKey = keys[keys.length - 1]!;
    current[lastKey] = value;
  }

  private deepMerge(...sources: Record<string, unknown>[]): Record<string, unknown> {
    const target: Record<string, unknown> = {};
    for (const source of sources) {
      for (const [key, val] of Object.entries(source)) {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          target[key] = this.deepMerge(
            (target[key] as Record<string, unknown>) ?? {},
            val as Record<string, unknown>,
          );
        } else {
          target[key] = val;
        }
      }
    }
    return target;
  }
}

export const configLoader = new ConfigLoader();
