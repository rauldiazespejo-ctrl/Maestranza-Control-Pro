import { z } from "zod";
import { validateRut } from "./rut";

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  rut: z.string().refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      return validateRut(val);
    },
    { message: "El RUT ingresado no es válido" }
  ),
  industry: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  paymentTerm: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
