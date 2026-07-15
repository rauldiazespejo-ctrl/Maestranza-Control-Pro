import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
  READ_ROLES: ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"],
  OPERATIONS_ROLES: ["ADMIN", "HSEQ_MANAGER", "OPERATIONS"],
  MANAGEABLE_ROLES: ["ADMIN"],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

const { requireAuth } = await import("@/lib/auth");
const { revalidatePath } = await import("next/cache");
const dbModule = await import("@/lib/db");
const { createFabricationGanttFromWorkOrder } = await import("@/lib/actions/gantt");

const transactionMock = dbModule.prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

describe("gantt actions - createFabricationGanttFromWorkOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: "usr-1", role: "OPERATIONS", companyId: "comp-1" },
    } as never);
  });

  it("reutiliza proyecto existente por code y enlaza OT sin fallar", async () => {
    const wo = {
      id: "wo-1",
      code: "OT-1001",
      title: "OT prueba",
      projectId: null,
      clientId: "cli-1",
      startDate: new Date("2026-07-01"),
      dueDate: new Date("2026-07-10"),
      client: { id: "cli-1", companyId: "comp-1" },
      responsible: null,
      project: null,
    };

    transactionMock.mockImplementation(async (fn: (tx: Record<string, unknown>) => Promise<unknown>) =>
      fn({
        workOrder: {
          findUnique: vi.fn().mockResolvedValue(wo),
          update: vi.fn().mockResolvedValue({ id: "wo-1", projectId: "proj-existing" }),
        },
        project: {
          findFirst: vi.fn().mockResolvedValue({ id: "proj-existing" }),
          create: vi.fn(),
        },
        company: { findFirst: vi.fn() },
        ganttTask: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: "gt-1" }),
          update: vi.fn().mockResolvedValue({ id: "gt-1", workOrderTaskId: null }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        workOrderTask: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "wot-1" }),
          update: vi.fn(),
        },
        auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      })
    );

    const result = await createFabricationGanttFromWorkOrder("wo-1");

    expect(result.projectId).toBe("proj-existing");
    expect(revalidatePath).toHaveBeenCalledWith("/gantt");
    expect(revalidatePath).toHaveBeenCalledWith("/ordenes");
    expect(revalidatePath).toHaveBeenCalledWith("/ordenes/wo-1");
  });

  it("consolida tareas heredadas y queda idempotente por processCode", async () => {
    const update = vi.fn().mockResolvedValue({ id: "legacy-1", workOrderTaskId: null });
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const create = vi.fn().mockResolvedValue({ id: "new-task" });
    const legacyTasks = [
      { id: "legacy-1", projectId: "proj-1", workOrderId: null, processCode: null, name: "01 · DETALLAMIENTO TECNICO · Solicitud de material", startDate: new Date("2026-07-01") },
      { id: "legacy-2", projectId: "proj-1", workOrderId: null, processCode: null, name: "01 · DETALLAMIENTO TECNICO · Solicitud de material", startDate: new Date("2026-07-01") },
      { id: "current-1", projectId: "proj-1", workOrderId: "wo-1", processCode: null, name: "DET-01 · Detallamiento tecnico · Solicitud de material", startDate: new Date("2026-07-01") },
    ];

    transactionMock.mockImplementation(async (fn: (tx: Record<string, unknown>) => Promise<unknown>) =>
      fn({
        workOrder: { findUnique: vi.fn().mockResolvedValue({
          id: "wo-1", code: "OT-1001", title: "OT prueba", projectId: "proj-1",
          clientId: "cli-1", startDate: new Date("2026-07-01"), dueDate: new Date("2026-07-31"),
          client: { id: "cli-1", companyId: "comp-1" }, responsible: null, project: { id: "proj-1" },
        }) },
        ganttTask: { findMany: vi.fn().mockResolvedValue(legacyTasks), create, update, deleteMany },
        workOrderTask: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "wot-1" }),
          update: vi.fn(),
        },
        auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      })
    );

    const result = await createFabricationGanttFromWorkOrder("wo-1");

    expect(result.removed).toBe(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "current-1" },
      data: expect.objectContaining({ processCode: "DET-01", workOrderId: "wo-1" }),
    }));
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["legacy-1", "legacy-2"] } } });
    expect(create).toHaveBeenCalledTimes(20);
  });

  it("lanza error claro en conflicto único Prisma (P2002)", async () => {
    transactionMock.mockRejectedValue({
      code: "P2002",
      clientVersion: "7.8.0",
      meta: {},
      name: "PrismaClientKnownRequestError",
    });

    await expect(createFabricationGanttFromWorkOrder("wo-err")).rejects.toThrow(
      "Conflicto de datos al crear proyecto/tareas para la OT. Intenta nuevamente."
    );
  });
});
