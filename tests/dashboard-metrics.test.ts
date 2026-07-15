import { describe, expect, it } from "vitest";
import { WorkOrderStatus } from "@prisma/client";
import { calculateWorkOrderMetrics } from "@/lib/dashboard-metrics";

const activeStatuses = [
  WorkOrderStatus.nueva,
  WorkOrderStatus.planificada,
  WorkOrderStatus.en_proceso,
  WorkOrderStatus.revision,
];

describe("calculateWorkOrderMetrics", () => {
  it("mantiene conteos y promedio global ponderado al agrupar por estado", () => {
    const result = calculateWorkOrderMetrics([
      { status: WorkOrderStatus.nueva, _count: { _all: 2 }, _avg: { progress: 10 } },
      { status: WorkOrderStatus.en_proceso, _count: { _all: 3 }, _avg: { progress: 50 } },
      { status: WorkOrderStatus.completada, _count: { _all: 1 }, _avg: { progress: 100 } },
    ], activeStatuses);

    expect(result.activeOrdersCount).toBe(5);
    expect(result.completedOrdersCount).toBe(1);
    expect(result.avgProgressResult._avg.progress).toBe(45);
  });

  it("devuelve promedio nulo cuando no existen ordenes", () => {
    const result = calculateWorkOrderMetrics([], activeStatuses);

    expect(result.activeOrdersCount).toBe(0);
    expect(result.completedOrdersCount).toBe(0);
    expect(result.avgProgressResult._avg.progress).toBeNull();
  });
});
