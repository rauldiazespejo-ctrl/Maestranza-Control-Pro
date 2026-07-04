import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: import("@prisma/client").UserRole;
    clientId?: string | null;
    companyId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: import("@prisma/client").UserRole;
      clientId?: string | null;
      companyId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: import("@prisma/client").UserRole;
    clientId?: string | null;
    companyId?: string | null;
  }
}
