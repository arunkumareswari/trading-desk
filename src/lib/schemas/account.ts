import { z } from "zod";

export const accountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startingBalance: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? v : Number(v)))
    .refine((n) => Number.isFinite(n) && n >= 0, "Must be a positive number"),
  currency: z.string().min(1).default("USD"),
  isDemo: z.boolean().optional().default(false),
});

export type AccountFormValues = z.input<typeof accountFormSchema>;
