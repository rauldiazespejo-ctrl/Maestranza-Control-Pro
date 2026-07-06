import { z } from "zod";

export const workOrderStatusSchema = z.enum([
  "nueva",
  "planificada",
  "en_proceso",
  "detenida",
  "revision",
  "completada",
  "cerrada",
]);

export const prioritySchema = z.enum(["baja", "media", "alta", "critica"]);

const optionalDateString = z
  .union([z.string(), z.undefined()])
  .transform((value) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  })
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Fecha inválida");

const optionalId = z
  .union([z.string(), z.undefined()])
  .transform((value) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  });

const optionalMoney = z
  .union([z.string(), z.undefined()])
  .transform((value) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  })
  .refine((value) => !value || !Number.isNaN(Number(value)), "Monto inválido")
  .refine((value) => !value || Number(value) >= 0, "El monto no puede ser negativo");

const progressSchema = z
  .union([z.string(), z.number()])
  .transform((value) => Number(value))
  .refine((value) => !Number.isNaN(value), "Avance inválido")
  .refine((value) => value >= 0, "El avance no puede ser menor a 0")
  .refine((value) => value <= 100, "El avance no puede superar 100");

export const workOrderSchema = z
  .object({
    code: z.string().min(1, "El código es obligatorio"),
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    status: workOrderStatusSchema,
    priority: prioritySchema,
    startDate: optionalDateString,
    dueDate: optionalDateString,
    progress: progressSchema,
    responsibleId: optionalId,
    clientId: optionalId,
    projectId: optionalId,
    estimatedCost: optionalMoney,
    actualCost: optionalMoney,
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) return true;
      return new Date(data.startDate) <= new Date(data.dueDate);
    },
    {
      message: "La fecha de término debe ser posterior o igual a la fecha de inicio",
      path: ["dueDate"],
    }
  );

export type WorkOrderFormData = z.input<typeof workOrderSchema>;
