import { z } from 'zod';

export const StartReviewInputSchema = z.object({
  prId: z.string().uuid(),
});

export type StartReviewInput = z.infer<typeof StartReviewInputSchema>;
