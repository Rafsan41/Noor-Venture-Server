import { z } from "zod";

export const createInvestmentSchema = z.object({
  proposalId: z.string().min(1),
  amount: z.number().positive("Investment amount must be positive"),
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
