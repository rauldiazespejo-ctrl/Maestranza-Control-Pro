"use server";

import { prisma } from "@/lib/db";
import { requireAuth, READ_ROLES } from "@/lib/auth";

export async function getOperationalReport(from?: string, to?: string) {
  const session = await requireAuth(READ_ROLES);
  
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const whereDate = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  
  const ordersWhere: Record<string, unknown> = { ...whereDate };
  const hseqWhere: Record<string, unknown> = { ...whereDate };
  const clientsWhere: Record<string, unknown> = {};

  if (session.user.role === "CLIENT" && session.user.clientId) {
    ordersWhere.clientId = session.user.clientId;
    hseqWhere.id = "none"; // Clients can't see hseq in general, return empty
    clientsWhere.id = session.user.clientId;
  }

  const [orders, hseq, clients] = await Promise.all([
    prisma.workOrder.findMany({ where: ordersWhere, include: { client: true } }),
    prisma.hseqRecord.findMany({ where: hseqWhere }),
    prisma.client.findMany({ where: clientsWhere, include: { _count: { select: { workOrders: true } } } }),
  ]);

  return { orders, hseq, clients };
}
