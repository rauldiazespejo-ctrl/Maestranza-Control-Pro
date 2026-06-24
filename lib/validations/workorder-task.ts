import { z } from "zod";

export const workOrderTaskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  progress: z.string().min(1, "El avance es obligatorio"),
  completed: z.boolean(),
  dueDate: z.string().optional(),
});

export type WorkOrderTaskFormData = z.infer<typeof workOrderTaskSchema>;
