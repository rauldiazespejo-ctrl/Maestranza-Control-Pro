import fs from "fs";

const file = "app/(dashboard)/dashboard/page.tsx";
let content = fs.readFileSync(file, "utf8");

const startIdx = content.indexOf("  const [");
const endIdx = content.indexOf("]);", startIdx) + 3;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + `  const {
    activeOrdersCount,
    delayedOrdersCount,
    completedOrdersCount,
    avgProgressResult,
    ordersInProcess: processOrders,
    hseqVencimientos,
    hseqAlertsCount,
    ganttOrders,
    hseqAlerts,
    recentActivity,
  } = await getDashboardStats();` + content.substring(endIdx);
  fs.writeFileSync(file, content, "utf8");
} else {
  console.log("Could not find block");
}
