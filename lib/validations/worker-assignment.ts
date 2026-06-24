import { z } from "zod";

export const workerAssignmentSchema = z.object({
  workerId: z.string().min(1, "El trabajador es obligatorio"),
  workOrderId: z.string().min(1, "La orden de trabajo es obligatoria"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hours: z.string().optional(),
});

export const workerAssignmentHoursSchema = z.object({
  hours: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type WorkerAssignmentFormData = z.infer<typeof workerAssignmentSchema>;
export type WorkerAssignmentHoursFormData = z.infer<typeof workerAssignmentHoursSchema>;
