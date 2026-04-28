import { z } from 'zod';
import { TestType } from '../../domain/entities/index.js';

export const CreateTestSuiteDtoSchema = z.object({
  contractId: z.string().uuid(),
  testType: z.nativeEnum(TestType),
});

export type CreateTestSuiteDto = z.infer<typeof CreateTestSuiteDtoSchema>;
