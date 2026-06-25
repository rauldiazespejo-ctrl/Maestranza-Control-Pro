import { Suspense } from "react";
import { OrdenesClient } from "@/components/ordenes/OrdenesClient";
import { getWorkOrders } from "@/lib/actions/workorders";
import { getClients } from "@/lib/actions/clients";
import { getWorkers } from "@/lib/actions/workers";
import { getProjects } from "@/lib/actions/projects";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Órdenes de trabajo · MAESTRANZA Control Pro",
};

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const [orders, clients, workers, projects] = await Promise.all([
    getWorkOrders({
      search: params.search,
      status: params.status,
      priority: params.priority,
    }),
    getClients(),
    getWorkers(),
    getProjects(),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <OrdenesClient orders={orders} clients={clients} workers={workers} projects={projects} />
    </Suspense>
  );
}
