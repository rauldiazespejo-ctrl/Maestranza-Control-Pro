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

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const requiredDateString = z
  .string()
  .min(1, "La fecha es obligatoria")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida");

const optionalDateString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  })
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Fecha inválida");

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

export const riskLevelSchema = z.enum(["bajo", "medio", "alto", "critico"]);
export const astStatusSchema = z.enum([
  "borrador",
  "en_revision",
  "aprobado",
  "requiere_revalidacion",
  "cerrado",
]);
export const permitTypeSchema = z.enum([
  "caliente",
  "izaje_critico",
  "altura",
  "loto",
  "electrico",
  "maquinaria",
  "espacio_confinado",
]);
export const permitStatusSchema = z.enum([
  "borrador",
  "aprobado",
  "activo",
  "suspendido",
  "cerrado",
  "vencido",
]);

export const astFormSchema = z.object({
  workOrderId: z.string().min(1, "La OT es obligatoria"),
  workOrderTaskId: optionalText,
  area: z.string().min(1, "El área/proceso es obligatorio"),
  equipmentId: optionalText,
  riskLevel: riskLevelSchema,
  supervisor: optionalText,
  stepsText: z.string().min(1, "Debes registrar al menos un paso de tarea"),
  hazardsText: z.string().min(1, "Debes registrar peligros y controles"),
  preStartChecks: optionalText,
  evidence: optionalText,
});

export type AstFormData = z.input<typeof astFormSchema>;

export const permitFormSchema = z
  .object({
    type: permitTypeSchema,
    workOrderId: z.string().min(1, "La OT es obligatoria"),
    workOrderTaskId: optionalText,
    astId: z.string().min(1, "El AST aprobado es obligatorio"),
    area: z.string().min(1, "El área/proceso es obligatorio"),
    equipmentId: optionalText,
    startAt: requiredDateString,
    endAt: requiredDateString,
    preconditions: optionalText,
    checklistText: z.string().min(1, "Debes registrar checklist del permiso"),
  })
  .refine((data) => new Date(data.endAt).getTime() > new Date(data.startAt).getTime(), {
    message: "El término debe ser posterior al inicio",
    path: ["endAt"],
  });

export type PermitFormData = z.input<typeof permitFormSchema>;

export const certificationSchema = z.object({
  equipmentId: z.string().min(1, "El equipo es obligatorio"),
  certType: z.string().min(1, "El tipo de certificación es obligatorio"),
  validFrom: optionalDateString,
  validTo: requiredDateString,
  status: z.string().min(1, "El estado es obligatorio"),
});

export type CertificationFormData = z.infer<typeof certificationSchema>;

export const competencySchema = z.object({
  companyId: z.string().min(1, "La empresa es obligatoria"),
  workerId: z.string().min(1, "El trabajador es obligatorio"),
  competencyType: z.string().min(1, "La competencia es obligatoria"),
  issuer: optionalText,
  validTo: requiredDateString,
});

export type CompetencyFormData = z.infer<typeof competencySchema>;
