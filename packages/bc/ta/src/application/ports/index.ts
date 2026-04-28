import { z } from 'zod';
import { TestType } from '../../domain/entities/index.js';

export const CreateTestSuiteInputSchema = z.object({
  contractId: z.string().uuid(),
  testType: z.nativeEnum(TestType),
});

export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteInputSchema>;
