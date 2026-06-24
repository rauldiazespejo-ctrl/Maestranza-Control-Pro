import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createAdapter() {
  if (databaseUrl.startsWith("libsql://")) {
    return new PrismaLibSql({ url: databaseUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  const sqliteFilePath = databaseUrl.startsWith("file:")
    ? path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        databaseUrl.replace("file:", "").replace(/^\.\//, "")
      )
    : databaseUrl;
  return new PrismaBetterSqlite3({ url: sqliteFilePath });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
