import { z } from "zod";

export const ganttTaskSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  projectId: z.string().min(1, "El proyecto es obligatorio"),
  workOrderId: z.string().optional(),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  endDate: z.string().min(1, "La fecha de término es obligatoria"),
  progress: z.string().min(1, "El avance es obligatorio"),
  status: z.enum(["pendiente", "en_progreso", "completada", "retrasada"]),
  responsible: z.string().optional(),
  dependencies: z.string().optional(),
});

export type GanttTaskFormData = z.infer<typeof ganttTaskSchema>;
