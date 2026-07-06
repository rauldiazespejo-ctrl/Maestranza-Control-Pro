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
