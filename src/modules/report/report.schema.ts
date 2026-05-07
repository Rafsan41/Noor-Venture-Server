import { z } from "zod";

export const createReportSchema = z.object({
  proposalId: z.string().min(1),
  month:      z.number().int().min(1).max(12),
  year:       z.number().int().min(2020).max(2100),
  revenue:    z.number().nonnegative(),
  expenses:   z.number().nonnegative(),
  notes:      z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
