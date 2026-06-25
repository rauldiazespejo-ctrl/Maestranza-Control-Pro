"use server";

import { prisma } from "@/lib/db";
import { auth, READ_ROLES } from "@/lib/auth";

export async function getOperationalReport(from?: string, to?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!READ_ROLES.includes(session.user.role as typeof READ_ROLES[number])) {
    throw new Error("No tienes permisos para ver reportes");
  }
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [orders, hseq, clients] = await Promise.all([
    prisma.workOrder.findMany({ where, include: { client: true } }),
    prisma.hseqRecord.findMany({ where }),
    prisma.client.findMany({ include: { _count: { select: { workOrders: true } } } }),
  ]);

  return { orders, hseq, clients };
}
