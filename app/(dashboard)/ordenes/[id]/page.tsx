import { notFound } from "next/navigation";
import { OrdenDetailClient } from "@/components/ordenes/OrdenDetailClient";
import { getWorkOrderById } from "@/lib/actions/workorders";
import { getActiveWorkersForAssignment } from "@/lib/actions/worker-assignments";

export const metadata = {
  title: "Detalle de OT",
};

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: Awaited<ReturnType<typeof getWorkOrderById>>;
  let activeWorkers: Awaited<ReturnType<typeof getActiveWorkersForAssignment>>;

  try {
    [data, activeWorkers] = await Promise.all([
      getWorkOrderById(id),
      getActiveWorkersForAssignment(),
    ]);
  } catch {
    notFound();
  }

  return <OrdenDetailClient order={data} activeWorkers={activeWorkers} />;
}
