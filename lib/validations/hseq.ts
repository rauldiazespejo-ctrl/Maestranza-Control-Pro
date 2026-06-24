import { z } from "zod";

export const hseqTypeSchema = z.enum([
  "inspeccion",
  "incidente",
  "accion_correctiva",
  "capacitacion",
  "permiso_trabajo",
  "matriz_riesgo",
]);

export const normSchema = z.enum(["ISO_45001", "ISO_9001", "ISO_14001", "DS_44"]);

export const hseqStatusSchema = z.enum(["abierto", "en_revision", "cerrado", "vencido"]);

export const hseqRecordSchema = z.object({
  type: hseqTypeSchema,
  norm: normSchema,
  description: z.string().min(1, "La descripción es obligatoria"),
  responsibleId: z.string().optional(),
  date: z.string().min(1, "La fecha es obligatoria"),
  dueDate: z.string().optional(),
  status: hseqStatusSchema,
  evidenceDocumental: z.string().optional(),
  signatureRequired: z.boolean(),
});

export type HseqRecordFormData = z.infer<typeof hseqRecordSchema>;
