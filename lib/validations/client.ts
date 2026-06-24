import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  rut: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  paymentTerm: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
