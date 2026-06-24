import { z } from "zod";

export const workerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  rut: z.string().min(1, "El RUT es obligatorio"),
  position: z.string().min(1, "El cargo es obligatorio"),
  specialty: z.string().optional(),
  status: z.enum(["activo", "inactivo"]),
  certifications: z.string().optional(),
  criticalExpires: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export type WorkerFormData = z.infer<typeof workerSchema>;
