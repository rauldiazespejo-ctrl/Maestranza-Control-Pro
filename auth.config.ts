import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (Object.values(UserRole) as string[]).includes(value);
}

const authConfig = {
  providers: [],
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
        session.user.id = typeof token.id === "string" ? token.id : "";
        if (isUserRole(token.role)) session.user.role = token.role;
        session.user.clientId = typeof token.clientId === "string" ? token.clientId : null;
        session.user.companyId = typeof token.companyId === "string" ? token.companyId : null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
