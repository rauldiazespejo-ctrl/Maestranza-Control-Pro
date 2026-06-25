import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

// ── RBAC roles ──────────────────────────────────────────────────────
export type Role = UserRole;

export const ADMIN_ROLES:       Role[] = ["ADMIN"];
export const MANAGEABLE_ROLES:  Role[] = ["ADMIN"];
export const HSEQ_ROLES:        Role[] = ["ADMIN", "HSEQ_MANAGER"];
export const OPERATIONS_ROLES:  Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"];
export const WRITE_ROLES:       Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"];
export const READ_ROLES:        Role[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"];

export function requireRole(role: Role | undefined, allowed: Role[]): void {
  if (!role || !allowed.includes(role)) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
}

/** Get authenticated session or throw — use in server actions */
export async function requireAuth(requiredRoles: Role[] = READ_ROLES) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  requireRole(session.user.role as Role, requiredRoles);
  return session;
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email },
          include: { client: true, company: true },
        });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

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
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.clientId = token.clientId as string | null;
        session.user.companyId = token.companyId as string | null;
      }
      return session;
    },
  },
});
