import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { validateRut, normalizeRut } from "@/lib/validations/rut";
import { headers } from "next/headers";
import authConfig from "@/auth.config";

// ── RBAC roles ──────────────────────────────────────────────────────
export type Role = UserRole;

export const ADMIN_ROLES:       Role[] = ["ADMIN"];
export const MANAGEABLE_ROLES:  Role[] = ["ADMIN"];
export const HSEQ_ROLES:        Role[] = ["ADMIN", "HSEQ_MANAGER"];
export const OPERATIONS_ROLES:  Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"];
export const WRITE_ROLES:       Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"];
export const READ_ROLES:        Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"];
export const INTERNAL_READ_ROLES: Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "VIEWER"];

/** Devuelve el cliente asociado o falla de forma cerrada para sesiones CLIENT. */
export function requireClientId(role: Role | undefined, clientId: string | null | undefined) {
  if (role === "CLIENT" && !clientId) {
    throw new Error("La cuenta cliente no tiene una empresa asociada");
  }
  return clientId;
}

/** Array derivado del enum de Prisma — siempre sincronizado */
const ALL_ROLES: readonly string[] = Object.values(UserRole);

/**
 * Verifica que un valor sea un Role valido.
 * @param value - Valor a verificar.
 * @returns `true` si el valor es un UserRole valido.
 */
export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && ALL_ROLES.includes(value);
}

/**
 * Verifica que un valor sea un string no vacio.
 * @param value - Valor a verificar.
 * @returns `true` si el valor es un string con longitud mayor a cero.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Lanza un error si el rol del usuario no esta incluido en los roles permitidos.
 * @param role - Rol del usuario autenticado.
 * @param allowed - Lista de roles con acceso permitido.
 * @throws {Error} Si el rol es undefined o no esta incluido en allowed.
 */
export function requireRole(role: Role | undefined, allowed: Role[]): void {
  if (!role || !allowed.includes(role)) {
    throw new Error("No tienes permisos para realizar esta accion");
  }
}

/**
 * Obtiene la sesion autenticada y valida que el usuario tenga uno de los roles requeridos.
 * @param requiredRoles - Lista de roles permitidos. Por defecto usa READ_ROLES.
 * @returns La sesion autenticada del usuario.
 * @throws {Error} Si no hay sesion activa o el rol no tiene permisos.
 */
export async function requireAuth(requiredRoles: Role[] = READ_ROLES) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const role = isValidRole(session.user.role) ? session.user.role : undefined;
  requireRole(role, requiredRoles);
  return session;
}

/** Obtiene la IP del cliente desde los headers */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

const credentialsSchema = z.object({
  rut: z.string().min(1, "RUT es requerido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

class InvalidCredentialsError extends CredentialsSignin {
  override code = "credenciales_invalidas";
  override message = "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.";
}

class TemporaryAttemptsError extends CredentialsSignin {
  override code = "intentos_temporales";
  override message = "Demasiados intentos fallidos. Espera unos minutos e intenta nuevamente.";
}

class AuthenticationUnavailableError extends CredentialsSignin {
  override code = "servicio_no_disponible";
  override message = "No se pudo validar el acceso con la base de datos. Revisa la configuración e intenta nuevamente.";
}

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "maestranza-control-pro-dev-secret"
    : undefined);

// Durante `next build`, algunos entornos hacen que NODE_ENV quede en "production"
// y entonces NextAuth exige el secret. Para que el build no falle, permitimos
// un fallback SOLO durante la fase de build. En runtime real, si falta el secret,
// mantenemos el error para no operar sin seguridad.
const isProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-production-compile" ||
  process.env.NEXT_PHASE === "phase-production";

const resolvedSecret =
  authSecret ?? (isProductionBuild ? "maestranza-control-pro-dev-secret" : undefined);

if (!resolvedSecret && process.env.NODE_ENV === "production" && !isProductionBuild) {
  throw new Error(
    "[AUTH] AUTH_SECRET o NEXTAUTH_SECRET deben estar configurados en producción (runtime)."
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: resolvedSecret,
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        rut: { label: "RUT", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { rut, password } = parsed.data;

        // ── Validar formato RUT ─────────────────────────────────────
        if (!validateRut(rut)) {
          throw new InvalidCredentialsError();
        }
        const normalizedRut = normalizeRut(rut);

        // ── Rate limiting por IP ────────────────────────────────────
        const clientIp = await getClientIp();
        const rateLimit = checkRateLimit(clientIp);
        if (!rateLimit.allowed) {
          throw new TemporaryAttemptsError();
        }

        if (!process.env.DATABASE_URL) {
          console.error("DATABASE_URL no está configurado para validar credenciales");
          throw new AuthenticationUnavailableError();
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { rut: normalizedRut },
            include: { client: true, company: true },
          });
        } catch (error) {
          console.error("No se pudo validar credenciales contra la base de datos", error);
          throw new AuthenticationUnavailableError();
        }
        if (!user || !user.active) {
          // Registrar intento fallido para rate limiting
          recordFailedAttempt(clientIp);
          return null;
        }

        // ── Contraseña obligatoria para todos los roles ────────────
        if (!password) {
          recordFailedAttempt(clientIp);
          return null;
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          recordFailedAttempt(clientIp);
          return null;
        }

        // Login exitoso: resetear rate limiting
        resetRateLimit(clientIp);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          companyId: user.companyId,
        };
      },
    }),
  ],
});
