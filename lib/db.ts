import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const isProduction = process.env.NODE_ENV === "production";
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurado");
  }

  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL debe usar PostgreSQL");
  }

  // Parsear DATABASE_URL para extraer parámetros de conexión si existen
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode") || url.searchParams.get("ssl");

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl:
      isProduction || sslMode === "require"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: isProduction ? 5 : 10,
    // Importante para serverless: cerrar conexiones inactivas rápidamente
    allowExitOnIdle: true,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: isProduction ? ["error"] : ["query", "error", "warn"],
  });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
