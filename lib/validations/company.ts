import { z } from "zod";
import { rutSchema } from "./rut";

export const companySchema = z.object({
  name: z.string().min(1, "La razon social es obligatoria"),
  rut: rutSchema,
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  logoUrl: z.string().url("URL invalida").optional().or(z.literal("")),
});

export type CompanyFormData = z.infer<typeof companySchema>;
