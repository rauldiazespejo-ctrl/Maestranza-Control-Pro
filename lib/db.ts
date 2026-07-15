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

  // Parsear DATABASE_URL para extraer parametros de conexion y host.
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode") || url.searchParams.get("ssl");
  const hostname = url.hostname.toLowerCase();
  const isPooledHost = /(?:pooler|pool|proxy)/.test(hostname);
  const configuredPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
  const poolMax = Number.isFinite(configuredPoolMax) && configuredPoolMax > 0
    ? configuredPoolMax
    : isProduction
      ? (isPooledHost ? 5 : 2)
      : 10;

  if (sslMode === "require" && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("uselibpqcompat", "true");
  }

  // Railway/Neon proxy usa certificados que pueden fallar con cadena no confiable.
  // En esos hosts se requiere SSL pero sin validacion estricta del certificado.
  const isRailwayProxyHost = hostname.endsWith(".proxy.rlwy.net");
  const shouldUseInsecureSsl =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false" &&
    (isRailwayProxyHost || Boolean(process.env.RAILWAY_ENVIRONMENT));

  const pool = new pg.Pool({
    connectionString: url.toString(),
    ssl:
      sslMode === "require" || isRailwayProxyHost
        ? { rejectUnauthorized: !shouldUseInsecureSsl }
        : undefined,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: isProduction ? 5000 : 10000,
    // Un unico socket serializaba todas las consultas Promise.all del dashboard.
    // Los hosts con pooler soportan mas concurrencia; conexiones directas quedan acotadas.
    max: poolMax,
    // Importante para serverless: cerrar conexiones inactivas rapidamente.
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
