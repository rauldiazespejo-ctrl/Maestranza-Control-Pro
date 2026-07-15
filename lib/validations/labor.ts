import { z } from "zod";

export const laborEntrySchema = z.object({
  id: z.string().optional(),
  assignmentId: z.string().min(1, "Selecciona una asignación"),
  workDate: z.string().date("Fecha inválida"),
  plannedHours: z.coerce.number().min(0).max(24, "Máximo 24 HH por registro"),
  actualHours: z.coerce.number().min(0).max(24).default(0),
  shift: z.enum(["dia", "noche", "extra"]),
  taskId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const fieldProgressSchema = z.object({
  taskId: z.string().min(1),
  workerId: z.string().optional(),
  progress: z.coerce.number().min(0).max(100),
  actualHours: z.coerce.number().min(0).max(24),
  comment: z.string().min(3, "Describe brevemente el trabajo ejecutado").max(1000),
  blocked: z.boolean().default(false),
  blocker: z.string().max(500).optional(),
  evidenceUrl: z.union([z.string().url("URL de evidencia inválida"), z.literal("")]).optional(),
}).refine((value) => !value.blocked || Boolean(value.blocker?.trim()), {
  message: "Indica la causa del bloqueo",
  path: ["blocker"],
});

export type LaborEntryInput = z.input<typeof laborEntrySchema>;
export type FieldProgressInput = z.input<typeof fieldProgressSchema>;
