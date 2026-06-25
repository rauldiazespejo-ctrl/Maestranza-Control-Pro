import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";

function createPrismaClient() {
  // Use PG adapter for PostgreSQL (Neon)
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("sslmode=require") || databaseUrl.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 30000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Fallback: native Prisma client for SQLite (local dev)
  return new PrismaClient();
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
