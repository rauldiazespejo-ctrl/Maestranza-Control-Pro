import fs from "fs";

const file = "app/(dashboard)/dashboard/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /import { prisma } from "@\/lib\/db";/,
  `import { getDashboardStats } from "@/lib/actions/dashboard";`
);

// const queriesBlockStart = `  const ACTIVE_STATUSES: WorkOrderStatus[] = ["nueva", "planificada", "en_proceso", "revision"];`;
// const queriesBlockEnd = `  const avgProgress = Math.round(avgProgressResult._avg.progress ?? 0);`;

const regex = /const ACTIVE_STATUSES[\s\S]*?\]\);/m;

content = content.replace(regex, `const now = new Date();
  
  const {
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
  } = await getDashboardStats();`);

fs.writeFileSync(file, content, "utf8");
