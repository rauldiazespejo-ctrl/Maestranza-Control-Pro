"use server";

import { prisma } from "@/lib/db";

export async function getOperationalReport(from?: string, to?: string) {
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
