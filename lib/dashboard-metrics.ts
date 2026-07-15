import { WorkOrderStatus } from "@prisma/client";

export interface WorkOrderStatusSummary {
  status: WorkOrderStatus;
  _count: { _all: number };
  _avg: { progress: number | null };
}

export function calculateWorkOrderMetrics(
  rows: WorkOrderStatusSummary[],
  activeStatuses: readonly WorkOrderStatus[],
) {
  const activeStatusSet = new Set(activeStatuses);
  let activeOrdersCount = 0;
  let completedOrdersCount = 0;
  let totalOrders = 0;
  let weightedProgress = 0;

  for (const row of rows) {
    const count = row._count._all;
    if (activeStatusSet.has(row.status)) activeOrdersCount += count;
    if (row.status === WorkOrderStatus.completada) completedOrdersCount = count;
    totalOrders += count;
    weightedProgress += (row._avg.progress ?? 0) * count;
  }

  return {
    activeOrdersCount,
    completedOrdersCount,
    avgProgressResult: {
      _avg: { progress: totalOrders > 0 ? weightedProgress / totalOrders : null },
    },
  };
}
