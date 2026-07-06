import { describe, expect, it } from "vitest";
import { cleanRut, formatRut, normalizeRut, validateRut } from "@/lib/validations/rut";

describe("validacion RUT", () => {
  it("valida, limpia y normaliza un RUT chileno correcto", () => {
    expect(cleanRut("12.345.678-5")).toBe("123456785");
    expect(validateRut("12.345.678-5")).toBe(true);
    expect(normalizeRut("12.345.678-5")).toBe("12345678-5");
  });

  it("rechaza digito verificador incorrecto", () => {
    expect(validateRut("12.345.678-9")).toBe(false);
  });

  it("formatea RUT limpio con puntos y guion", () => {
    expect(formatRut("123456785")).toBe("12.345.678-5");
  });
});
