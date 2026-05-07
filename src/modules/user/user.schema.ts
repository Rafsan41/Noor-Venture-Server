import { z } from "zod";

export const updateProfileSchema = z.object({
  name:      z.string().min(2).optional(),
  bio:       z.string().max(300).optional(),
  phone:     z.string().min(10).max(15).optional(),
  nidNumber: z.string().min(10).max(20).optional(),
  image:     z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
