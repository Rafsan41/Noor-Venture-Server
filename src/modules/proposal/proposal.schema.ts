import { z } from "zod";

export const createProposalSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(100, "Description must be at least 100 characters"),
  businessType: z.string().min(2),
  category: z.string().min(2),
  location: z.string().min(2),
  fundingGoal: z.number().positive("Funding goal must be positive"),
  minimumInvestment: z.number().positive("Minimum investment must be positive"),
  profitSharePercent: z.number().min(5).max(50, "Profit share must be between 5% and 50%"),
  duration: z.number().int().min(3).max(60, "Duration must be between 3 and 60 months"),
  images: z.array(z.string().url()).optional().default([]),
  documents: z.array(z.string().url()).optional().default([]),
  deadline: z.string().datetime(),
  expectedReturn: z.number().min(0).max(100).optional(),
});

export const updateProposalSchema = createProposalSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  reason: z.string().optional(),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
