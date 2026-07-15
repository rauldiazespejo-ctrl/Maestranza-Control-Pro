"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireClientId, READ_ROLES } from "@/lib/auth";

export async function getOperationalReport(from?: string, to?: string) {
  const session = await requireAuth(READ_ROLES);
  
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const whereDate = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  
  const ordersWhere: import('@prisma/client').Prisma.WorkOrderWhereInput = { ...whereDate };
  const hseqWhere: import('@prisma/client').Prisma.HseqRecordWhereInput = { ...whereDate };
  const clientsWhere: import('@prisma/client').Prisma.ClientWhereInput = {};

  const scopedClientId = requireClientId(session.user.role, session.user.clientId);
  if (session.user.role === "CLIENT") {
    ordersWhere.clientId = scopedClientId!;
    hseqWhere.id = "none"; // Clients can't see hseq in general, return empty
    clientsWhere.id = scopedClientId!;
  }

  const [orders, hseq, clients] = await Promise.all([
    prisma.workOrder.findMany({ where: ordersWhere, include: { client: true } }),
    prisma.hseqRecord.findMany({ where: hseqWhere }),
    prisma.client.findMany({ where: clientsWhere, include: { _count: { select: { workOrders: true } } } }),
  ]);

  return { orders, hseq, clients };
}
