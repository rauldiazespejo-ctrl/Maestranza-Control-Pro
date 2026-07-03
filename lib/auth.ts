import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { validateRut, normalizeRut } from "@/lib/validations/rut";
import { headers } from "next/headers";

// ── RBAC roles ──────────────────────────────────────────────────────
export type Role = UserRole;

export const ADMIN_ROLES:       Role[] = ["ADMIN"];
export const MANAGEABLE_ROLES:  Role[] = ["ADMIN"];
export const HSEQ_ROLES:        Role[] = ["ADMIN", "HSEQ_MANAGER"];
export const OPERATIONS_ROLES:  Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"];
export const WRITE_ROLES:       Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"];
export const READ_ROLES:        Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"];

/** Todos los valores validos del enum UserRole */
const ALL_ROLES: readonly string[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"] as const;

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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
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
          throw new Error("RUT_INVALIDO");
        }
        const normalizedRut = normalizeRut(rut);

        // ── Rate limiting por IP ────────────────────────────────────
        const clientIp = await getClientIp();
        const rateLimit = checkRateLimit(clientIp);
        if (!rateLimit.allowed) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.user.findUnique({
          where: { rut: normalizedRut },
          include: { client: true, company: true },
        });
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
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId;
        token.companyId = user.companyId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = isNonEmptyString(token.id) ? token.id : "";
        session.user.role = isNonEmptyString(token.role) ? token.role : "";
        session.user.clientId = isNonEmptyString(token.clientId) ? token.clientId : null;
        session.user.companyId = isNonEmptyString(token.companyId) ? token.companyId : null;
      }
      return session;
    },
  },
});
