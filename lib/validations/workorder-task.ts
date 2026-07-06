import { z } from "zod";

const optionalDateString = z
  .union([z.string(), z.undefined()])
  .transform((value) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  })
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Fecha inválida");

const progressSchema = z
  .union([z.string(), z.number()])
  .transform((value) => Number(value))
  .refine((value) => !Number.isNaN(value), "Avance inválido")
  .refine((value) => value >= 0, "El avance no puede ser menor a 0")
  .refine((value) => value <= 100, "El avance no puede superar 100");

export const workOrderTaskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  processArea: z.string().optional(),
  critical: z.boolean(),
  requiresPermit: z.boolean(),
  progress: progressSchema,
  completed: z.boolean(),
  dueDate: optionalDateString,
});

export type WorkOrderTaskFormData = z.input<typeof workOrderTaskSchema>;
