import { z } from 'zod';

export const StartReviewDtoSchema = z.object({
  prId: z.string().uuid(),
});

export type StartReviewDto = z.infer<typeof StartReviewDtoSchema>;
