import { Suspense } from "react";
import { GanttClient } from "@/components/gantt/GanttClient";
import { getGanttTasks } from "@/lib/actions/gantt";
import { prisma } from "@/lib/db";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Carta Gantt · MAESTRANZA Control Pro",
};

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [tasks, projects, workOrders] = await Promise.all([
    getGanttTasks({ projectId: params.projectId, status: params.status }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.workOrder.findMany({ select: { id: true, code: true, title: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <GanttClient tasks={tasks} projects={projects} workOrders={workOrders} />
    </Suspense>
  );
}
