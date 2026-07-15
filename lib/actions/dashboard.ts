"use server";

import { prisma } from "@/lib/db";
import { requireAuth, READ_ROLES } from "@/lib/auth";
import { WorkOrderStatus } from "@prisma/client";
import { calculateWorkOrderMetrics } from "@/lib/dashboard-metrics";

export async function getDashboardStats() {
  const session = await requireAuth(READ_ROLES);
  if (session.user.role === "CLIENT") {
    throw new Error("No autorizado");
  }

  const ACTIVE_STATUSES = [WorkOrderStatus.nueva, WorkOrderStatus.planificada, WorkOrderStatus.en_proceso, WorkOrderStatus.revision];
  const now = new Date();

  const [
    statusSummary,
    delayedOrdersCount,
    ordersInProcess,
    hseqVencimientos,
    hseqAlertsCount,
    ganttOrders,
    recentActivity,
  ] = await Promise.all([
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: { _all: true },
      _avg: { progress: true },
    }),
    prisma.workOrder.count({
      where: { status: { in: ACTIVE_STATUSES }, dueDate: { lt: now } },
    }),
    prisma.workOrder.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: { client: true, project: true, responsible: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 12,
    }),
    prisma.hseqRecord.findMany({
      where: {
        OR: [
          { status: { in: ["abierto", "vencido"] } },
          { dueDate: { lt: now } },
        ],
      },
      include: { responsible: true },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 10,
    }),
    prisma.hseqRecord.count({
      where: { OR: [{ status: { in: ["abierto", "vencido"] } }, { dueDate: { lt: now } }] },
    }),
    prisma.workOrder.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        OR: [{ startDate: { not: null } }, { dueDate: { not: null } }],
      },
      select: {
        id: true,
        code: true,
        title: true,
        startDate: true,
        dueDate: true,
        progress: true,
        status: true,
        priority: true,
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    prisma.workOrder.findMany({
      include: { client: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const { activeOrdersCount, completedOrdersCount, avgProgressResult } =
    calculateWorkOrderMetrics(statusSummary, ACTIVE_STATUSES);
  const hseqAlerts = hseqVencimientos.slice(0, 5);

  return {
    activeOrdersCount,
    delayedOrdersCount,
    completedOrdersCount,
    avgProgressResult,
    ordersInProcess,
    hseqVencimientos,
    hseqAlertsCount,
    ganttOrders,
    hseqAlerts,
    recentActivity,
  };
}
