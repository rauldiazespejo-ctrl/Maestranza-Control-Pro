import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";
const isProduction = process.env.NODE_ENV === "production";

function createPrismaClient() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurado");
  }

  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL debe usar PostgreSQL");
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: !isProduction,
    },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
