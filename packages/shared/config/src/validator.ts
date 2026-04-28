import { AppConfigSchema } from './schema.js';
import type { AppConfig } from './schema.js';
import { Result } from '@ulw/shared-domain';

export function validateConfig(raw: unknown): Result<AppConfig> {
  const parseResult = AppConfigSchema.safeParse(raw);

  if (!parseResult.success) {
    return Result.err(new Error(`Config validation failed: ${parseResult.error.message}`));
  }

  return Result.ok(parseResult.data);
}
