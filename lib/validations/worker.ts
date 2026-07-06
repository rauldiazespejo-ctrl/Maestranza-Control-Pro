import { z } from "zod";
import { rutSchema } from "./rut";

export const workerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  rut: rutSchema,
  position: z.string().min(1, "El cargo es obligatorio"),
  specialty: z.string().optional(),
  status: z.enum(["activo", "inactivo"]),
  profile: z.enum(["empleado", "supervisor"]),
  engagement: z.enum(["permanente", "spot"]),
  canCreateWorkers: z.boolean().optional(),
  canAssignWorkOrders: z.boolean().optional(),
  spotDescription: z.string().optional(),
  certifications: z.string().optional(),
  criticalExpires: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export type WorkerFormData = z.infer<typeof workerSchema>;
