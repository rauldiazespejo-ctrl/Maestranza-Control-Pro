import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SchemaColumn = {
  table_name: string;
  column_name: string;
};

const requiredColumns = [
  { table: "Session", column: "updatedAt" },
  { table: "Contact", column: "updatedAt" },
  { table: "Document", column: "updatedAt" },
  { table: "WorkerAssignment", column: "updatedAt" },
  { table: "Worker", column: "profile" },
  { table: "Worker", column: "engagement" },
  { table: "Worker", column: "canCreateWorkers" },
  { table: "Worker", column: "canAssignWorkOrders" },
];

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {};
  let status = 200;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    console.error("[health] database check failed", error instanceof Error ? error.message : error);
    checks.database = "fail";
    status = 503;
  }

  if (checks.database === "ok") {
    try {
      const columns = await prisma.$queryRaw<SchemaColumn[]>`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('Session', 'Contact', 'Document', 'WorkerAssignment', 'Worker')
      `;

      const present = new Set(columns.map((column) => `${column.table_name}.${column.column_name}`));
      const missing = requiredColumns.filter(
        (column) => !present.has(`${column.table}.${column.column}`)
      );

      if (missing.length > 0) {
        checks.schema = "fail";
        status = 503;
        console.error("[health] schema drift detected", missing);
      } else {
        checks.schema = "ok";
      }
    } catch (error) {
      console.error("[health] schema check failed", error instanceof Error ? error.message : error);
      checks.schema = "fail";
      status = 503;
    }
  }

  return NextResponse.json(
    {
      status: status === 200 ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
