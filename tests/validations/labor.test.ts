import { describe, expect, it } from "vitest";
import { fieldProgressSchema, laborEntrySchema } from "@/lib/validations/labor";

describe("planificación de HH", () => {
  it("acepta una asignación diaria válida", () => {
    const value = laborEntrySchema.parse({ assignmentId: "a1", workDate: "2026-07-15", plannedHours: "8", actualHours: "6.5", shift: "dia", taskId: "" });
    expect(value.plannedHours).toBe(8);
    expect(value.actualHours).toBe(6.5);
  });

  it("rechaza más de 24 HH en un registro", () => {
    expect(() => laborEntrySchema.parse({ assignmentId: "a1", workDate: "2026-07-15", plannedHours: 25, shift: "dia" })).toThrow();
  });
});

describe("avance desde terreno", () => {
  it("exige causa cuando la tarea queda bloqueada", () => {
    const result = fieldProgressSchema.safeParse({ taskId: "t1", progress: 40, actualHours: 3, comment: "Armado parcial", blocked: true, blocker: "" });
    expect(result.success).toBe(false);
  });

  it("acepta reporte operativo completo", () => {
    const result = fieldProgressSchema.safeParse({ taskId: "t1", progress: 70, actualHours: 4, comment: "Soldadura completada", blocked: false });
    expect(result.success).toBe(true);
  });
});
