import { Suspense } from "react";
import { GanttClient } from "@/components/gantt/GanttClient";
import { getGanttTasks } from "@/lib/actions/gantt";
import { getProjects } from "@/lib/actions/projects";
import { getWorkOrders } from "@/lib/actions/workorders";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Carta Gantt",
};

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [tasks, projects, workOrders] = await Promise.all([
    getGanttTasks({ projectId: params.projectId, status: params.status }),
    getProjects(),
    getWorkOrders(),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <GanttClient tasks={tasks} projects={projects} workOrders={workOrders} />
    </Suspense>
  );
}
