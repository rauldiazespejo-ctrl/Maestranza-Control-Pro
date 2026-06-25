import fs from "fs";

const file = "app/(dashboard)/dashboard/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /import { prisma } from "@\/lib\/db";/,
  `import { getDashboardStats } from "@/lib/actions/dashboard";`
);

const queriesBlock = `  const ACTIVE_STATUSES = ["nueva", "planificada", "en_proceso", "revision"];
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const [
    activeOrdersCount,
    delayedOrdersCount,
    completedCount,
    avgProgress,
    recentActivity,
    hseqVencimientos,
    hseqAlertsCount,
    ganttOrders,
  ] = await Promise.all([
    prisma.workOrder.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.workOrder.count({
      where: {
        status: { in: ACTIVE_STATUSES },
        dueDate: { lt: now },
      },
    }),
    prisma.workOrder.count({ where: { status: "completada" } }),
    prisma.workOrder.aggregate({ _avg: { progress: true } }),
    // Órdenes recientes (actividad)
    prisma.workOrder.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: { client: true },
    }),
    // HSEQ Vencimientos
    prisma.hseqRecord.findMany({
      where: {
        OR: [
          { status: "vencido" },
          {
            dueDate: { lte: thirtyDaysFromNow },
            status: { not: "cerrado" },
          },
        ],
      },
      include: { responsible: true },
      orderBy: [{ dueDate: "asc" }, { date: "desc" }],
    }),
    // HSEQ Alertas pendientes
    prisma.hseqRecord.count({
      where: {
        OR: [
          { status: "vencido" },
          {
            dueDate: { lte: now },
            status: { not: "cerrado" },
          },
        ],
      },
    }),
    // Gantt resumido (órdenes activas con fecha)
    prisma.workOrder.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        startDate: { not: null },
        dueDate: { not: null },
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        progress: true,
        startDate: true,
        dueDate: true,
      },
      orderBy: { startDate: "asc" },
      take: 15,
    }),
  ]);`;

content = content.replace(queriesBlock, `  const {
    activeOrdersCount,
    delayedOrdersCount,
    completedCount,
    avgProgress,
    recentActivity,
    hseqVencimientos,
    hseqAlertsCount,
    ganttOrders,
  } = await getDashboardStats();
  
  const now = new Date();`);

fs.writeFileSync(file, content, "utf8");
