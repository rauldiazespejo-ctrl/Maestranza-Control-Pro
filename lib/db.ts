import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";
const isProduction = process.env.NODE_ENV === "production";

function createPrismaClient() {
  // PostgreSQL (Neon / producción)
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: {
        // Producción: Neon tiene certificado válido — no necesitas rejectUnauthorized: false
        // Desarrollo local: usa rejectUnauthorized: false si sslmode=require
        rejectUnauthorized: !isProduction,
      },
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Fallback: SQLite local (desarrollo)
  return new PrismaClient();
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
