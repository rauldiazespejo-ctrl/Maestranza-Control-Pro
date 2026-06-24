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

export const workOrderSchema = z.object({
  code: z.string().min(1, "El código es obligatorio"),
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  status: workOrderStatusSchema,
  priority: prioritySchema,
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  progress: z.string().min(1, "El avance es obligatorio"),
  responsibleId: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  estimatedCost: z.string().optional(),
  actualCost: z.string().optional(),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
