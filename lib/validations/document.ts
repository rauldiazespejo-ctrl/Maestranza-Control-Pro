import { z } from "zod";

export const documentSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    url: z.string().min(1, "La URL es obligatoria").url("La URL no es válida"),
    type: z.string().optional(),
    workOrderId: z.string().optional(),
    hseqRecordId: z.string().optional(),
    isPublic: z.boolean(),
  })
  .refine((data) => data.workOrderId || data.hseqRecordId, {
    message: "Debe asociar el documento a una orden de trabajo o un registro HSEQ",
    path: ["workOrderId"],
  });

export type DocumentFormData = z.infer<typeof documentSchema>;
