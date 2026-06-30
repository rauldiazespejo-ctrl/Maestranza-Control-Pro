/**
 * Validación de RUT Chileno — Algoritmo Módulo 11
 *
 * Formato esperado: XX.XXX.XXX-X o XXXXXXXX-X
 * El dígito verificador puede ser 0-9 o K
 */

import { z } from "zod";

/** Limpia el RUT: quita puntos, guión, espacios y pasa a mayúsculas */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, "").toUpperCase().trim();
}

/** Extrae el número base y el dígito verificador de un RUT limpio */
function splitRut(cleaned: string): { number: string; dv: string } | null {
  if (cleaned.length < 2) return null;
  const dv = cleaned.slice(-1);
  const number = cleaned.slice(0, -1);
  if (!/^\d+$/.test(number)) return null;
  return { number, dv };
}

/** Calcula el dígito verificador usando el algoritmo módulo 11 */
export function calculateDv(rutNumber: string): string {
  let sum = 0;
  let multiplier = 2;

  // Recorremos de derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    const digit = rutNumber[i];
    if (digit === undefined) continue;
    sum += parseInt(digit, 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 11) return "0";
  if (dv === 10) return "K";
  return String(dv);
}

/** Valida un RUT completo: formato + dígito verificador */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== "string") return false;

  const cleaned = cleanRut(rut);

  // Mínimo 2 caracteres (1 número + DV), máximo 9 (8 números + K/0-9)
  // Pero también pueden ser RUTs con menos dígitos (ej: 1-9)
  if (cleaned.length < 2 || cleaned.length > 10) return false;

  // Debe ser numérico excepto el último carácter que puede ser K o dígito
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;
  if (!/^[\dK]$/.test(dv)) return false;

  const calculatedDv = calculateDv(body);
  return calculatedDv === dv;
}

/** Formatea un RUT a XX.XXX.XXX-X (asume que ya está validado) */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  const split = splitRut(cleaned);
  if (!split) return rut;

  const { number, dv } = split;

  // Formatear con puntos cada 3 dígitos desde la derecha
  const formattedNumber = Number(number).toLocaleString("es-CL", {
    minimumIntegerDigits: 1,
  });

  return `${formattedNumber}-${dv}`;
}

/** Normaliza un RUT para almacenamiento: limpio sin puntos, con guión */
export function normalizeRut(rut: string): string {
  const cleaned = cleanRut(rut);
  const split = splitRut(cleaned);
  if (!split) return cleaned;
  return `${split.number}-${split.dv}`;
}

// ── Schemas Zod ───────────────────────────────────────────────────────────

/** Schema Zod para RUT obligatorio y válido */
export const rutSchema = z
  .string()
  .min(1, "El RUT es obligatorio")
  .refine((val) => validateRut(val), {
    message: "El RUT ingresado no es válido",
  })
  .transform((val) => normalizeRut(val));

/** Schema Zod para RUT opcional — si viene vacío pasa, si viene algo debe ser válido */
export const rutOptionalSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((val) => {
    if (!val || val.trim() === "") return undefined;
    return val;
  })
  .refine(
    (val) => {
      if (val === undefined) return true;
      return validateRut(val);
    },
    { message: "El RUT ingresado no es válido" }
  )
  .transform((val) => {
    if (val === undefined) return undefined;
    return normalizeRut(val);
  });
